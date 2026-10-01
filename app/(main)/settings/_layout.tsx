import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="about" />
      <Stack.Screen name="safe-area-check" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="my-tickets" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="update-phone" />
    </Stack>
  );
}
