import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Modal,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router/react-navigation";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { useAuth } from "../../../src/context/AuthContext";
import { useToast } from "../../../src/context/ToastContext";
import { AccountApi } from "../../../src/api/generated/endpoints/account-api";
import { Configuration } from "../../../src/api/generated/configuration";
import api, { API_BASE_URL } from "../../../src/services/api";
import {
  getApiErrorMessage,
  getRequestErrorMessage,
} from "../../../src/utils/apiError";
import { formatGender } from "../../../src/utils/helpers";
import type {
  BasicSchoolUserProfileDto,
  SubjectInfoDto,
} from "../../../src/api/generated/models";

// ─── API Clients ──────────────────────────────────────────────────────────────
const accountApi = new AccountApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
};

const getAvatarColors = (role: string, gender?: string): [string, string] => {
  // Brand blue per user request
  return ["#135BEC", "#135BEC"];
};

// ─── Sub-components ──────────────────────────────────────────────────────────
interface ProfileChipProps {
  label: string;
  value: string;
}
const ProfileChip = ({ label, value }: ProfileChipProps) => (
  <View style={styles.chip}>
    <Text style={styles.chipLabel}>{label}</Text>
    <Text style={styles.chipValue}>{value}</Text>
  </View>
);

interface SettingRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  showChevron?: boolean;
}
const SettingRow = ({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  onPress,
  danger = false,
  showChevron = true,
}: SettingRowProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.listItem,
      pressed && styles.listItemPressed,
    ]}
    onPress={onPress}
    android_ripple={{ color: "#F1F5F9" }}
    hitSlop={8}
  >
    <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={icon as any} size={20} color={iconColor} />
    </View>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && { color: "#EF4444" }]}>
        {label}
      </Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={18} color="#C4CBD6" />
    )}
  </Pressable>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [isQRVisible, setIsQRVisible] = useState(false);

  const isStudent = user?.role === "student";
  const isStaff = user?.role === "staff";
  const isAdmin = [
    "admin",
    "administrator",
    "hod",
    "proprietress",
    "principal",
    "vice principal",
  ].includes(user?.backendRole?.toLowerCase() || "");

  const {
    data: profileData = null,
    isPending: isLoading,
    isError,
    error: profileQueryError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["profile", user?.id || "anonymous"],
    queryFn: async () => {
      const response = await accountApi.getMyProfile();
      if (!response.data.success || !response.data.data) {
        throw new Error(
          getApiErrorMessage(response.data, "Failed to load profile"),
        );
      }
      return response.data.data;
    },
    enabled: !!user,
  });

  const onRefresh = () => {
    refetch();
  };

  const error = isError
    ? getRequestErrorMessage(profileQueryError, "Profile error")
    : null;

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  // ─── Derived display values ──────────────────────────────────────────────
  const displayName = profileData
    ? `${profileData.firstName || ""} ${profileData.middleName ?? ""} ${profileData.lastName || ""}`.trim()
    : (user?.name ?? "");

  const displayRole = isStaff ? "Staff" : "Student";
  const gender = formatGender(profileData?.gender);
  const avatarColors = getAvatarColors(user?.role ?? "student", gender);
  const initials = getInitials(displayName || user?.name || "U");
  const classLabel = profileData?.classInfo
    ? [
        profileData.classInfo.classLevel,
        profileData.classInfo.classCode,
        profileData.classInfo.department,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  // Role-based visibility for the overlapping card
  const showClassCard = !isLoading && !!profileData?.classInfo;

  return (
    <SafeAreaView style={styles.safeContainer} edges={["left", "right"]}>
      {isFocused && <StatusBar style="light" />}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* ── Hero Header ──────────────────────────────────────── */}
        <LinearGradient
          colors={avatarColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBg, { paddingTop: insets.top + 24 }]}
        >
          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>

          {/* Name & role */}
          <View style={styles.heroInfo}>
            {isLoading && !profileData ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginBottom: 20 }} />
            ) : (
              <>
                <Text style={styles.heroName}>{displayName || "—"}</Text>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{displayRole}</Text>
                </View>
                {/* ID styled like email in mockup (white/80, 14px) */}
                <Text style={styles.heroAdmissionNo}>
                  {profileData?.userNo || "—"}
                </Text>
              </>
            )}
          </View>

          {/* Curved bottom edge */}
          <View style={styles.heroCurve} />
        </LinearGradient>

        {/* ── Error state ────────────────────────────────────── */}

        {/* ── Settings Groups ────────────────────────────────── */}
        <View
          style={[
            styles.body,
            !(showClassCard || isLoading) && { marginTop: -20, paddingTop: 12 },
          ]}
        >
          {/* Overlapping Class Card (Replacement for chips) */}
          {isLoading ? (
            <View
              style={[
                styles.classCard,
                { justifyContent: "center", minHeight: 88 },
              ]}
            >
              <ActivityIndicator color="#135BEC" />
            </View>
          ) : showClassCard ? (
            <View style={styles.classCard}>
              <View style={styles.classIconWrap}>
                <Ionicons
                  name={isStudent ? "school-outline" : "briefcase-outline"}
                  size={24}
                  color={"#135BEC"}
                />
              </View>
              <View style={styles.classContent}>
                <Text style={styles.classLabelSmall}>
                  {isStudent
                    ? "CLASS INFORMATION"
                    : profileData?.classInfo?.role?.toUpperCase() ||
                      "CLASS ASSIGNMENT"}
                </Text>
                <Text style={styles.classTitleText}>
                  {classLabel || (isStudent ? "—" : "Not Assigned")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => setIsQRVisible(true)}
              >
                <Ionicons name="qr-code" size={20} color="#135BEC" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Account group */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Account</Text>
            <View style={styles.card}>
              <SettingRow
                icon="qr-code-outline"
                iconColor="#135BEC"
                iconBg="rgba(19, 91, 236, 0.1)"
                label="My Digital Badge"
                subtitle="Your personal access QR code"
                onPress={() => setIsQRVisible(true)}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="lock-closed-outline"
                iconColor="#0D9488"
                iconBg="#F0FDFA"
                label="Change Password"
                subtitle="Update your account password"
                onPress={() => router.push("/(main)/settings/change-password")}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="person-outline"
                iconColor="#6366F1"
                iconBg="#EEF2FF"
                label="Personal Details"
                subtitle="Manage your private info"
                onPress={() => router.push("/(main)/settings/personal-details")}
              />
            </View>
          </View>

          {/* Support group */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Support</Text>
            <View style={styles.card}>
              <SettingRow
                icon="help-circle-outline"
                iconColor="#EF4444"
                iconBg="#FEF2F2"
                label="Help & Support"
                subtitle="FAQs and contact options"
                onPress={() => router.push("/(main)/settings/help-support")}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="shield-checkmark-outline"
                iconColor="#6366F1"
                iconBg="#EEF2FF"
                label="Privacy Policy"
                subtitle="How we handle your data"
                onPress={() => router.push("/(main)/settings/privacy-policy")}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="information-circle-outline"
                iconColor="#135BEC"
                iconBg="#EFF6FF"
                label="About & Updates"
                subtitle="Version info and changelog"
                onPress={() => router.push("/(main)/settings/about")}
              />
            </View>
          </View>

          {/* Danger zone */}
          <View style={styles.group}>
            <View style={styles.card}>
              <SettingRow
                icon="log-out-outline"
                iconColor="#EF4444"
                iconBg="#FEE2E2"
                label="Log Out"
                onPress={logout}
                danger
                showChevron={false}
              />
            </View>
          </View>

          <Text style={styles.footerText}>Elleonora Student Companion</Text>
        </View>
      </ScrollView>

      {/* QR Code Bottom Sheet */}
      <Modal
        visible={isQRVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsQRVisible(false)}
      >
        <Pressable
          style={styles.qrModalContainer}
          onPress={() => setIsQRVisible(false)}
        >
          <View style={styles.qrSheet}>
            <View style={styles.qrHandle} />

            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>
                Digital {user?.backendRole || displayRole} Badge
              </Text>
              <Text style={styles.qrSubtitle}>
                Present this code for identification
              </Text>
            </View>

            <View style={styles.qrContent}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={profileData?.userNo || user?.id || "—"}
                  size={200}
                  color={COLORS.primary}
                  backgroundColor="#FFFFFF"
                />
              </View>

              <Text style={styles.qrUserName}>{displayName}</Text>
              <Text style={styles.qrUserId}>{profileData?.userNo || "—"}</Text>
            </View>

            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => setIsQRVisible(false)}
            >
              <Text style={styles.qrCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollView: { flex: 1 },

  // ── Hero ────────────────────────────────────────────────────────────
  heroBg: {
    alignItems: "center",
    paddingBottom: 0,
    overflow: "hidden", // For blobs
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 1,
  },
  heroInfo: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 50, // Pushes the curve and overlay card down
    paddingHorizontal: 20,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  heroBadgeText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chipRowCentered: {
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
  },
  heroAdmissionNo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
    paddingBottom: 10, // Added space before the curve starts
    fontWeight: "400",
    textAlign: "center",
  },
  centeredContent: {
    alignItems: "center",
  },
  chipLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  chipValue: { fontSize: 13, color: "#FFFFFF", fontWeight: "700" },
  heroCurve: {
    alignSelf: "stretch",
    height: 20, // Reduced height per user request
    backgroundColor: "#F6F6F8",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // ── Class Card ───────────────────────────────────────────────────────
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  classIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(19, 91, 236, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  classContent: {
    flex: 1,
    marginLeft: 12,
  },
  classLabelSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  classTitleText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  classIdText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  // ── Error Banner ─────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorMsg: { flex: 1, fontSize: 13, color: "#DC2626" },
  retryText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },

  // ── Body ─────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 24, // Pushed inside for tighter look
    paddingTop: 0,
    paddingBottom: 40,
    marginTop: -64,
    gap: 8,
  },
  group: { marginTop: 8, gap: 6 },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Row ──────────────────────────────────────────────────────────────
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12,
  },
  listItemPressed: { backgroundColor: "#F8FAFC" },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  rowSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 1 },

  // ── Misc ─────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 66 },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 16,
    fontWeight: "500",
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    position: "relative",
  },
  qrSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
    zIndex: 1,
  },
  qrHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    marginBottom: 24,
  },
  qrHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  qrSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    fontFamily: "Lexend",
  },
  qrContent: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  qrUserName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  qrUserId: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
    fontFamily: "Lexend",
  },
  qrCloseButton: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  qrCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    fontFamily: "Lexend",
  },
});
