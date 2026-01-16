import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { enableScreens } from "react-native-screens";
import RootNavigator from "./RootNavigator";

enableScreens();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};

export default function Navigation() {
  return (
    <NavigationContainer theme={theme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
