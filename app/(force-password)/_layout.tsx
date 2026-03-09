import { Stack } from "expo-router";

export default function ForcePasswordLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        gestureEnabled: false, // Essential lockdown requirement
        animation: 'slide_from_bottom' 
      }} 
    />
  );
}
