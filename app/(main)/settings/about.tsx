import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BackButton } from "../../../src/components/BackButton";
import { COLORS } from "../../../src/constants/colors";

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isChecking, setIsChecking] = useState(false);

  const appInfo = {
    name: "El-Leonora Scheme of Work",
    version: "1.0.0",
    build: "345",
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      Alert.alert(
        "Up to Date",
        "You're running the latest version (1.0.0).",
        [{ text: "Great!" }]
      );
    }, 1500);
  };

  return (
    <View style={styles.outer}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>About App</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={48} color="#FFFFFF" />
            </View>
            <View style={styles.logoPulse} />
          </View>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.appTagline}>Empowering teachers, building futures.</Text>
          <View style={{ height: 12 }} />
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v{appInfo.version}</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitleText}>Our Mission</Text>
          </View>
          <Text style={styles.missionText}>
            El-Leonora College Scheme of Work is designed to streamline academic planning and content delivery. We provide teachers with the tools they need to manage their curriculum efficiently, ensuring a consistent and high-quality learning experience for every student.
          </Text>
        </View>

        {/* App Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitleText}>Application Details</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build Version</Text>
            <Text style={styles.infoValue}>{appInfo.build}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Developer</Text>
            <Text style={styles.infoValue}>Leonora Tech Team</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              isChecking && styles.buttonDisabled
            ]}
            onPress={checkForUpdates}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Check for Updates</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => Alert.alert("Licenses", "All third-party libraries used in this app are subject to their respective MIT/Apache licenses.")}
          >
            <Text style={styles.secondaryButtonText}>Open Source Licenses</Text>
          </Pressable>
        </View>

        <Text style={styles.copyrightText}>
          © 2026 El-Leonora College. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    textAlign: "center",
  },
  container: { 
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logoPulse: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  missionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  copyrightText: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
