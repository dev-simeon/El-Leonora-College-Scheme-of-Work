import React from "react";
import { View, Text as NativeText, TouchableOpacity, StyleSheet } from "react-native";
import { LexendText as Text } from "./LexendText";
import { SPACING } from "../constants/spacing";
import { TYPO } from "../constants/typography";
import { COLORS } from "../constants/colors";

export function ItemCard({
  id,
  title,
  subtitle,
  onPress,
}: {
  id: string;
  title: string;
  subtitle?: string;
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity onPress={() => onPress(id)} style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: SPACING.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: TYPO.body, fontWeight: "600", color: COLORS.text },
  subtitle: { fontSize: TYPO.caption, color: COLORS.muted, marginTop: 4 },
});
