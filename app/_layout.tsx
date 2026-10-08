import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useFonts, Lexend_400Regular } from "@expo-google-fonts/lexend";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../src/constants/colors";
import { ToastProvider } from "../src/context/ToastContext";
import { ErrorBoundary } from "../src/components";
import { cleanupStaleApks } from "../src/services/updateService";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncStoragePersister } from "../src/services/queryClient";

function RootLayoutNav() {
  const { token, isLoading, mustChangePassword } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Remove any leftover APK files from a previous update attempt.
    // Fire-and-forget — errors are caught inside cleanupStaleApks.
    cleanupStaleApks();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === "(auth)";
    const inForcePasswordGroup = rootSegment === "(force-password)";

    if (!token) {
      // Not authenticated
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (mustChangePassword) {
      // Must change password
      if (!inForcePasswordGroup) {
        router.replace("/(force-password)/change-password");
      }
    } else {
      // Authenticated and not first login
      // Redirect to main if we're in auth, force-password, or at root
      if (inAuthGroup || inForcePasswordGroup || !segments.length) {
        router.replace("/(main)/home");
      }
    }
  }, [token, isLoading, mustChangePassword, segments]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const routePath = segments.join("/");
    const statusSurface = routePath === "(main)/settings"
      ? COLORS.brandBlue
      : routePath.startsWith("(main)/fees")
        ? COLORS.primary
        : "#FFFFFF";

    document.documentElement.style.setProperty(
      "--ios-pwa-status-surface",
      statusSurface,
    );
  }, [segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.backgroundLight }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lexend: Lexend_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.backgroundLight }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <AuthProvider>
              <StatusBar style="dark" />
              <RootLayoutNav />
            </AuthProvider>
          </PersistQueryClientProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
