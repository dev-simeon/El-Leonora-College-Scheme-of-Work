import { Tabs } from "expo-router";
import { COLORS } from "../../src/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomTabBar } from "../../src/components/CustomTabBar";

export default function MainLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: COLORS.brandBlue,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 12,
          height: 60 + Math.max(insets.bottom, 12),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: "Fees & Payments",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
