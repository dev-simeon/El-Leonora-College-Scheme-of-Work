import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { useAuth } from "../../../src/context/AuthContext";

// Mask phone: show first 4 and last 4, hide middle digits
const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  const visible = 4;
  const masked = digits.slice(0, visible) + " *** " + digits.slice(-4);
  return masked;
};

// Icons
const EditIcon = () => (
  <Svg width={15} height={16} viewBox="0 0 15 16" fill="none">
    <Path
      d="M3.12112 11.8889H3.91279L9.34334 6.45833L8.55168 5.66667L3.12112 11.0972V11.8889ZM2.01001 13V10.6389L9.34334 3.31944C9.45445 3.21759 9.57714 3.13889 9.7114 3.08333C9.84566 3.02778 9.98686 3 10.135 3C10.2832 3 10.4267 3.02778 10.5656 3.08333C10.7045 3.13889 10.8248 3.22222 10.9267 3.33333L11.6906 4.11111C11.8017 4.21296 11.8827 4.33333 11.9336 4.47222C11.9845 4.61111 12.01 4.75 12.01 4.88889C12.01 5.03704 11.9845 5.17824 11.9336 5.3125C11.8827 5.44676 11.8017 5.56944 11.6906 5.68056L4.37112 13H2.01001ZM8.94057 6.06944L8.55168 5.66667L9.34334 6.45833L8.94057 6.06944Z"
      fill="white"
    />
  </Svg>
);

const BookIcon = () => (
  <Ionicons name="book-outline" size={24} color={COLORS.primary} />
);

const ToolsIcon = () => (
  <Ionicons name="construct-outline" size={24} color="#F97316" />
);

const ChevronIcon = () => (
  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Toggle between male/female avatar
  const [isFemale, setIsFemale] = useState(false);

  return (
    <SafeAreaView style={styles.safeContainer} edges={["left", "right"]}>
      <StatusBar
        style="dark"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Avatar with gender toggle */}
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() => setIsFemale(f => !f)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.avatarCircle,
                { backgroundColor: isFemale ? "#FCE7F3" : "#EFF6FF" }
              ]}>
                <Ionicons
                  name={isFemale ? "woman" : "man"}
                  size={52}
                  color={isFemale ? "#DB2777" : "#135BEC"}
                />
              </View>
              {/* gender switch hint */}
              <View style={styles.genderBadge}>
                <Ionicons
                  name="swap-horizontal"
                  size={12}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileName}>{user?.name || "Jane Doe"}</Text>
            <Text style={styles.profileRole}>{user?.role === 'teacher' ? "Teacher - Science Dept" : "Student"}</Text>
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {user?.role === 'teacher' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ASSIGNED CLASSES</Text>
                {/* Mocked classes check - in real app this would come from an API or State */}
                { [] && [].length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Ionicons name="school-outline" size={32} color="#94A3B8" />
                    <Text style={styles.emptyStateText}>No classes assigned yet.</Text>
                  </View>
                ) : (
                  <View style={styles.card}>
                    <TouchableOpacity style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <View style={[styles.iconBackground, { backgroundColor: "#EFF6FF" }]}>
                          <BookIcon />
                        </View>
                        <Text style={styles.listItemText}>SS2 - English Language</Text>
                      </View>
                      <ChevronIcon />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <View style={[styles.iconBackground, { backgroundColor: "#FFF7ED" }]}>
                          <ToolsIcon />
                        </View>
                        <Text style={styles.listItemText}>JSS3 - Basic Tech</Text>
                      </View>
                      <ChevronIcon />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* GENERAL Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GENERAL</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push("/(main)/settings/change-password")}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: "#F0FDFA" }]}>
                        <Ionicons name="lock-closed-outline" size={22} color="#0D9488" />
                    </View>
                    <Text style={styles.listItemText}>Change Password</Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push("/(main)/settings/update-phone")}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: "#EFF6FF" }]}>
                      <Ionicons name="call-outline" size={22} color="#135BEC" />
                    </View>
                    <Text style={styles.listItemText}>Update Phone Number</Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push("/(main)/settings/help-support")}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: "#FEF2F2" }]}>
                        <Ionicons name="help-circle-outline" size={22} color="#EF4444" />
                    </View>
                    <Text style={styles.listItemText}>Help & Support</Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push("/(main)/settings/privacy-policy")}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: "#EEF2FF" }]}>
                         <Ionicons name="shield-checkmark-outline" size={22} color="#6366F1" />
                    </View>
                    <Text style={styles.listItemText}>Privacy Policy</Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => router.push("/(main)/settings/about")}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: "#EFF6FF" }]}>
                         <Ionicons name="information-circle-outline" size={22} color="#135BEC" />
                    </View>
                    <Text style={styles.listItemText}>
                      About & Check for Updates
                    </Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={logout}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.iconBackground, { backgroundColor: "#FEE2E2" }]}>
                         <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.listItemText, { color: "#EF4444" }]}>
                      Logout
                    </Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>
              </View>
            </View>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>
                App Version 1.0.0 (Build 345)
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  genderBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 9999,
    backgroundColor: "#135BEC",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  editIconContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: "#135BEC",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27.5,
    color: "#0F172A",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    color: "#135BEC",
    marginBottom: 8,
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  phonePillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#135BEC",
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 32,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 0.6,
    color: "#135BEC",
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    color: "#0F172A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    color: "#64748B",
    textAlign: "center",
  },
});
