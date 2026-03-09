import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../src/constants/colors";

function RootLayoutNav() {
  const { token, isLoading, isFirstLogin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
    } else if (isFirstLogin) {
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
  }, [token, isLoading, isFirstLogin, segments]);

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
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
