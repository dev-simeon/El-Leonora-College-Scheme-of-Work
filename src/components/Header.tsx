import React from "react";
import { View, Text as NativeText, TouchableOpacity, StyleSheet } from "react-native";
import { LexendText as Text } from "./LexendText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { SPACING } from "../constants/spacing";

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>{"‹"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { padding: 8 },
  backText: { fontSize: 20, color: COLORS.primary },
  backPlaceholder: { width: 32 },
  title: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  right: { minWidth: 32 },
});
