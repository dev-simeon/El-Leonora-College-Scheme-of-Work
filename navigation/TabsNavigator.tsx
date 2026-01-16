import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../app/(tabs)/index";
import SettingsScreen from "../app/(tabs)/settings";
import { TabsParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";

const Tabs = createBottomTabNavigator<TabsParamList>();

export default function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }: { route: { name: keyof TabsParamList } }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          const name = route.name === "Home" ? "home" : "settings";
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}
