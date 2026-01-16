import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' } });
