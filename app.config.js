// app.config.js
// Dynamic Expo config — reads version.json so that a single
// source of truth drives BOTH the in-app display AND the EAS build version.
//
// To bump the release:
//   1. Edit src/constants/version.json (versionCode + versionName)
//   2. Run: eas build   ← EAS picks up the new values automatically
//
// References:
//   https://docs.expo.dev/versions/latest/config/app/
//   https://docs.expo.dev/eas/build/

const versionInfo = require('./src/constants/version.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Elleonora student companion',
    slug: 'el-leonora-college-scheme-of-work',

    // ── Version ──────────────────────────────────────────────────────────────
    // Driven by src/constants/version.json — single source of truth
    version: versionInfo.versionName,      // semver shown in stores, e.g. "1.0.0"
    platforms: ['ios', 'android', 'web'],

    // ── Android ──────────────────────────────────────────────────────────────
    android: {
      package: 'com.elleonoracollege.schemeofwork',
      versionCode: versionInfo.versionCode, // integer build counter, e.g. 1

      // Needed so the APK installer intent (ACTION_VIEW) works on Android 8+.
      // REQUEST_INSTALL_PACKAGES lets the OS show the "Install unknown app" dialog.
      permissions: [
        'REQUEST_INSTALL_PACKAGES',
        'READ_EXTERNAL_STORAGE',
      ],
    },

    // ── iOS ──────────────────────────────────────────────────────────────────
    ios: {
      bundleIdentifier: 'com.elleonoracollege.schemeofwork',
      buildNumber: versionInfo.versionName, // iOS uses a string, match semver
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    // ── EAS / Extra ──────────────────────────────────────────────────────────
    extra: {
      eas: {
        projectId: 'b38b28e2-3eba-410f-8e55-77657a4d7a5f',
      },
    },

    scheme: 'el-leonora-college',
    userInterfaceStyle: 'automatic',

    androidNavigationBar: {
      visible: 'immersive',
      barStyle: 'dark-content',
      backgroundColor: '#ffffff',
    },

    plugins: [
      'expo-font',
      'expo-router',
      'expo-secure-store',
    ],
  },
};
