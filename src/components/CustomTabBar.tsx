import React from "react";
import {
  View,
  Text as NativeText,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LexendText as Text } from "./LexendText";
import { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

const HomeIcon = ({ color, focused }: { color: string; focused?: boolean }) => (
  <Svg width={25} height={28} viewBox="0 0 25 28" fill="none">
    <Path
      d="M6.17662 20.8056H9.09329V14.9722H14.9266V20.8056H17.8433V12.0556L12.01 7.68056L6.17662 12.0556V20.8056ZM4.23218 22.75V11.0833L12.01 5.25L19.7877 11.0833V22.75H12.9822V16.9167H11.0377V22.75H4.23218Z"
      fill={color}
    />
  </Svg>
);

const SettingsIcon = ({
  color,
  focused,
}: {
  color: string;
  focused?: boolean;
}) => (
  <Svg width={24} height={28} viewBox="0 0 24 28" fill="none">
    <Path
      d="M9.32862 23.7222L8.94005 20.6111C8.72958 20.6111 8.53125 20.4329 8.34506 20.3195C8.15887 20.206 7.97674 20.0845 7.79864 19.9549L4.90869 21.1701L2.2373 16.5521L4.73869 14.6563C4.7225 14.5428 4.71441 14.4335 4.71441 14.3281C4.71441 14.2228 4.71441 14.1134 4.71441 14C4.71441 13.8866 4.71441 13.7772 4.71441 13.6719C4.71441 13.5666 4.7225 13.4572 4.73869 13.3438L2.2373 11.4479L4.90869 6.82987L7.79864 8.04515C7.97674 7.91552 8.16292 7.79399 8.3572 7.68056C8.55149 7.56714 8.74577 7.46991 8.94005 7.3889L9.32862 4.27778H14.6714L15.06 7.3889C15.2704 7.46991 15.4688 7.56714 15.6549 7.68056C15.8411 7.79399 16.0233 7.91552 16.2014 8.04515L19.0913 6.82987L21.7627 11.4479L19.2613 13.3438C19.2775 13.4572 19.2856 13.5666 19.2856 13.6719C19.2856 13.7772 19.2856 13.8866 19.2856 14C19.2856 14.1134 19.2856 14.2228 19.2856 14.3281C19.2856 14.4335 19.2694 14.5428 19.237 14.6563L21.7384 16.5521L19.067 21.1701L16.2014 19.9549C16.0233 20.0845 15.8371 20.206 15.6428 20.3195C15.4485 20.4329 15.2542 20.5301 15.06 20.6111L14.6714 23.7222H9.32862ZM11.0286 21.7778H12.9471L13.2871 19.2014C13.789 19.0718 14.2545 18.8814 14.6835 18.6302C15.1126 18.3791 15.5052 18.0752 15.8614 17.7188L18.2656 18.7153L19.2127 17.0625L17.1242 15.4826C17.2052 15.2558 17.2618 15.0168 17.2942 14.7656C17.3266 14.5145 17.3428 14.2593 17.3428 14C17.3428 13.7407 17.3266 13.4855 17.2942 13.2344C17.2618 12.9832 17.2052 12.7442 17.1242 12.5174L19.2127 10.9375L18.2656 9.28473L15.8614 10.3056C15.5052 9.93288 15.1126 9.62096 14.6835 9.3698C14.2545 9.11864 13.789 8.92825 13.2871 8.79862L12.9714 6.22223H11.0529L10.7129 8.79862C10.211 8.92825 9.74552 9.11864 9.31647 9.3698C8.88743 9.62096 8.49482 9.92478 8.13864 10.2813L5.73439 9.28473L4.78726 10.9375L6.8758 12.4931C6.79485 12.7361 6.73818 12.9792 6.7058 13.2222C6.67342 13.4653 6.65723 13.7245 6.65723 14C6.65723 14.2593 6.67342 14.5104 6.7058 14.7535C6.73818 14.9965 6.79485 15.2396 6.8758 15.4826L4.78726 17.0625L5.73439 18.7153L8.13864 17.6945C8.49482 18.0671 8.88743 18.3791 9.31647 18.6302C9.74552 18.8814 10.211 19.0718 10.7129 19.2014L11.0286 21.7778ZM12.0486 17.4028C12.9876 17.4028 13.789 17.0706 14.4528 16.4063C15.1166 15.7419 15.4485 14.9398 15.4485 14C15.4485 13.0602 15.1166 12.2581 14.4528 11.5938C13.789 10.9294 12.9876 10.5972 12.0486 10.5972C11.0934 10.5972 10.2879 10.9294 9.63218 11.5938C8.97648 12.2581 8.64863 13.0602 8.64863 14C8.64863 14.9398 8.97648 15.7419 9.63218 16.4063C10.2879 17.0706 11.0934 17.4028 12.0486 17.4028Z"
      fill={color}
    />
  </Svg>
);

const AttendanceIcon = ({
  color,
  focused,
}: {
  color: string;
  focused?: boolean;
}) => (
  <Svg width={24} height={28} viewBox="0 0 24 28" fill="none">
    <Path
      d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM10 18L7 15L8.41 13.59L10 15.17L15.59 9.58L17 11L10 18Z"
      fill={color}
    />
  </Svg>
);

const FeesIcon = ({ color, focused }: { color: string; focused?: boolean }) => (
  <Svg width={24} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
      fill={color}
    />
  </Svg>
);

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          // Attendance is a staff/admin tool; fees remains student-only.
          if (route.name === "index" || (options as any).href === null) return null;
          if (isStudent && route.name === "attendance") return null;
          if (!isStudent && route.name === "fees") return null;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const iconColor = isFocused ? "#135BEC" : "#4C669A";

          const renderIcon = (name: string, color: string, focused: boolean) => {
            switch (name) {
              case "home":
                return <HomeIcon color={color} focused={focused} />;
              case "attendance":
                return <AttendanceIcon color={color} focused={focused} />;
              case "fees":
                return <FeesIcon color={color} focused={focused} />;
              case "settings":
                return <SettingsIcon color={color} focused={focused} />;
              default:
                return null;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <View style={styles.buttonContent}>
                {isFocused ? (
                  <View style={styles.activeIconPill}>
                    <View style={styles.iconWrapper}>
                      {renderIcon(route.name, iconColor, isFocused)}
                    </View>
                  </View>
                ) : (
                  <View style={styles.inactiveIconContainer}>
                    <View style={styles.iconWrapper}>
                      {renderIcon(route.name, iconColor, isFocused)}
                    </View>
                  </View>
                )}
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.label,
                      isFocused ? styles.activeLabel : styles.inactiveLabel,
                    ]}
                  >
                    {label as string}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    minHeight: 60,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  activeIconPill: {
    backgroundColor: "rgba(19, 91, 236, 0.15)",
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveIconContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    fontFamily: "Lexend",
  },
  activeLabel: {
    fontWeight: "700",
    color: "#135BEC",
  },
  inactiveLabel: {
    fontWeight: "700",
    color: "#4C669A",
  },
});
