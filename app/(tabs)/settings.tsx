import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Header } from "../../components/Header";
import { SPACING } from "../../constants/spacing";
import { TYPO } from "../../constants/typography";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" />
      <View style={styles.content}>
        <Text style={styles.row}>Example setting row (local only)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  row: { fontSize: TYPO.body },
});
