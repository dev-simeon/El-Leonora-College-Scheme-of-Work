import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';
import { Platform, Alert, Linking } from 'react-native';

export interface DownloadProgress {
  /** 0–1 */
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** How long (ms) to wait before deleting the APK after the installer launches.
 *  The installer process still needs to read the file for a short time —
 *  deleting immediately can silently break the install. 60 s is safe. */
const APK_CLEANUP_DELAY_MS = 60 * 1000;

/** Maximum age (ms) before we consider a leftover APK stale. 24 hours. */
const APK_STALE_AGE_MS = 24 * 60 * 60 * 1000;

// ── Cleanup helpers ───────────────────────────────────────────────────────────

/**
 * Schedules deletion of the APK file 60 seconds after the installer is
 * launched.  The installer still needs the file briefly; deleting it
 * immediately can cause the install to fail silently.
 *
 * Fire-and-forget — callers do NOT need to await this.
 */
const scheduleApkCleanup = (localUri: string): void => {
  setTimeout(async () => {
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      console.log('[updateService] APK cleaned up:', localUri);
    } catch (err) {
      // Non-fatal — the file will be cleaned up on the next app launch
      // by cleanupStaleApks().
      console.warn('[updateService] APK cleanup failed (non-fatal):', err);
    }
  }, APK_CLEANUP_DELAY_MS);
};

/**
 * Call this once on app startup (e.g. in the root layout) to remove any
 * leftover APK files from previous update attempts.  Files older than 24 h
 * are considered stale and are safely removed.
 *
 * Strategy:
 *   1. Download to documentDirectory
 *   2. Launch installer → scheduleApkCleanup() fires after 60 s
 *   3. cleanupStaleApks() runs on next cold start as a safety net
 */
export const cleanupStaleApks = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;

  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) return;

    const { exists, isDirectory } = await FileSystem.getInfoAsync(dir);
    if (!exists || !isDirectory) return;

    const files = await FileSystem.readDirectoryAsync(dir);
    const apkFiles = files.filter((f) => f.toLowerCase().endsWith('.apk'));

    const now = Date.now();

    await Promise.all(
      apkFiles.map(async (apk) => {
        const uri = `${dir}${apk}`;
        try {
          const info = await FileSystem.getInfoAsync(uri);
          // modificationTime is in seconds since epoch (present when file exists)
          const ageMs = info.exists && 'modificationTime' in info
            ? now - (info as any).modificationTime * 1000
            : APK_STALE_AGE_MS + 1; // treat unknown age as stale

          if (ageMs > APK_STALE_AGE_MS) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            console.log('[updateService] Stale APK removed:', apk);
          }
        } catch {
          // Best-effort — skip this file
        }
      })
    );
  } catch (err) {
    console.warn('[updateService] cleanupStaleApks error (non-fatal):', err);
  }
};

// ── Settings helper ───────────────────────────────────────────────────────────

/**
 * Opens the Android system screen that lets the user grant
 * "Install unknown apps" permission for this specific app.
 *
 * Required on Android 8+ (API 26+) when sideloading APKs.
 * After the user grants permission and presses Back, they can retry the install.
 */
export const openUnknownSourcesSettings = async (): Promise<void> => {
  const packageName = Application.applicationId ?? 'com.elleonoracollege.schemeofwork';

  try {
    // Opens: Settings > Install unknown apps > [Your App]
    // The `data` must be "package:<your.package.name>"
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES,
      { data: `package:${packageName}` }
    );
  } catch {
    // Fallback: general app settings for older ROMs that lack the specific screen
    await Linking.openSettings();
  }
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Downloads an APK from the given URL and then launches the Android
 * system installer (ACTION_VIEW with APK MIME type).
 *
 * Full strategy:
 *  1. Download APK  →  documentDirectory/<filename>.apk
 *  2. Obtain a FileProvider content:// URI
 *  3. Fire ACTION_VIEW — Android shows its standard install screen
 *  4. Schedule APK deletion 60 s later (installer still reads the file briefly)
 *  5. If the intent is rejected (no "Install unknown apps" permission),
 *     prompt the user to open system settings and retry.
 *  6. On the next cold start, cleanupStaleApks() removes any leftover APKs.
 */
export const downloadAndInstallApk = async (
  apkUrl: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> => {
  if (Platform.OS !== 'android') {
    throw new Error('APK updates are only available on Android. iOS updates come via the App Store.');
  }

  const fileName = apkUrl.split('/').pop() ?? 'update.apk';
  // documentDirectory is preferred over cacheDirectory — some OEM Package
  // Installers refuse cache-dir files due to SELinux policy.
  const localUri = `${FileSystem.documentDirectory}${fileName}`;

  // ── Step 1: Remove old copy ──────────────────────────────────────────────
  const existing = await FileSystem.getInfoAsync(localUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  }

  // ── Step 2: Download ─────────────────────────────────────────────────────
  const downloadResumable = FileSystem.createDownloadResumable(
    apkUrl,
    localUri,
    {},
    (evt) => {
      if (evt.totalBytesExpectedToWrite > 0 && onProgress) {
        onProgress({
          progress: evt.totalBytesWritten / evt.totalBytesExpectedToWrite,
          downloadedBytes: evt.totalBytesWritten,
          totalBytes: evt.totalBytesExpectedToWrite,
        });
      }
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error('Download failed: no file URI returned');

  // ── Step 3: Get FileProvider content:// URI ──────────────────────────────
  const contentUri = await FileSystem.getContentUriAsync(result.uri);

  // ── Step 4: Launch installer (with permission fallback) ──────────────────
  await launchInstaller(contentUri);

  // ── Step 5: Schedule cleanup (fire-and-forget) ───────────────────────────
  scheduleApkCleanup(localUri);
};

// ── Internal: intent launcher with permission fallback ────────────────────────

/**
 * Fires the ACTION_VIEW intent to launch the Android package installer.
 * If rejected (e.g. "Install unknown apps" is disabled for this app),
 * shows an Alert guiding the user to grant the permission.
 *
 * Flags:
 *   1          = FLAG_GRANT_READ_URI_PERMISSION  (lets installer read our file)
 *   268435456  = FLAG_ACTIVITY_NEW_TASK          (required from non-Activity context)
 */
const launchInstaller = async (contentUri: string): Promise<void> => {
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1 | 268435456,
      type: 'application/vnd.android.package-archive',
    });
  } catch (intentError: any) {
    console.warn('[updateService] Installer intent rejected:', intentError?.message);

    // Guide the user to enable "Install from unknown sources" for this app.
    await new Promise<void>((resolve, reject) => {
      Alert.alert(
        'Permission Required',
        'To install updates, you need to allow this app to install from unknown sources.\n\nTap "Open Settings", enable the permission, then come back and tap "Install" again.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('User cancelled the permission request.')),
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              await openUnknownSourcesSettings();
              resolve();
            },
          },
        ],
        { cancelable: false }
      );
    });
  }
};
