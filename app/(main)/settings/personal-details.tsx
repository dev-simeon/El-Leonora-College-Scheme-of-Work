import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router/react-navigation";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
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
import type { BasicSchoolUserProfileDto } from "../../../src/api/generated/models";

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

const getAvatarColors = (): [string, string] => {
  return ["#135BEC", "#135BEC"]; // Brand blue
};

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}

const InfoRow = ({ icon, label, value, isLast = false }: InfoRowProps) => (
  <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon as any} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.infoTextWrap}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  </View>
);

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isStudent = user?.role === "student";
  const isStaff = user?.role === "staff";
  const {
    data: profileData = null,
    isPending: isLoading,
    isError,
    error: queryError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const response = await accountApi.getMyProfile();
      if (!response.data.success || !response.data.data) {
        throw new Error(
          getApiErrorMessage(response.data, "Failed to load profile"),
        );
      }
      return response.data.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!user?.id,
  });

  const error = isError
    ? getRequestErrorMessage(queryError, "Profile error")
    : null;

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  const onRefresh = () => {
    refetch();
  };

  const displayName = profileData
    ? `${profileData.firstName ?? ""} ${profileData.middleName ?? ""} ${profileData.lastName ?? ""}`.trim()
    : (user?.name ?? "");

  const initials = getInitials(displayName || user?.name || "U");
  const avatarColors = getAvatarColors();

  const roleLabel = isStudent ? "STUDENT" : "STAFF";
  const subRoleLabel = isStudent
    ? profileData?.classInfo?.classLevel || "—"
    : user?.backendRole || "Member";

  const userId = profileData?.userNo || "—";
  const gender = formatGender(profileData?.gender);
  const email = profileData?.email || user?.email || "—";
  const phone = profileData?.mobilePhone || "—";
  const department = profileData?.classInfo?.department || "—";
  const classLabel = profileData?.classInfo
    ? `${profileData.classInfo.classLevel} · ${profileData.classInfo.classCode}`
    : "—";

  // Address
  const address = profileData?.addressInfo
    ? `${profileData.addressInfo.street}, ${profileData.addressInfo.city}, ${profileData.addressInfo.state}`
    : "—";

  return (
    <View style={styles.safeContainer}>
      {isFocused && (
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      )}

      {/* ── Fixed Header ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {isLoading && !isRefetching ? (
          <View
            style={{
              flex: 1,
              paddingVertical: 100,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color="#135BEC" />
          </View>
        ) : (
          <View style={styles.body}>
            {/* Profile Section moved into body */}
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarOuter}>
                  {/* Large Circle for Avatar */}
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editBadge}>
                  <Ionicons name="pencil" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>
                {`${roleLabel} · ${subRoleLabel}`}
              </Text>
            </View>

            {/* Section: Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="person-outline"
                  label="Full Name"
                  value={displayName}
                />
                <InfoRow
                  icon="badge-outline"
                  label={isStudent ? "Student ID" : "Staff ID"}
                  value={userId}
                />
                <InfoRow
                  icon="male-female-outline"
                  label="Gender"
                  value={gender}
                />
                <InfoRow
                  icon="calendar-outline"
                  label="Date of Birth"
                  value="—"
                />
                <InfoRow
                  icon="mail-outline"
                  label="Email Address"
                  value={email}
                />
                <InfoRow
                  icon="call-outline"
                  label="Phone Number"
                  value={phone}
                  isLast
                />
              </View>
            </View>

            {/* Section: Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="location-outline"
                  label="Home Address"
                  value={address}
                  isLast
                />
              </View>
            </View>

            {/* Section: Academic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACADEMIC INFORMATION</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="school-outline"
                  label={isStudent ? "Current Class" : "Department"}
                  value={isStudent ? classLabel : department}
                />
                <InfoRow
                  icon="calendar-clear-outline"
                  label={isStudent ? "Admission Date" : "Employment Date"}
                  value="—"
                  isLast
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    zIndex: 10,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#135BEC20",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 56,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: "700",
    color: "#135BEC",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#135BEC",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  profileRole: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: "center",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
    backgroundColor: COLORS.backgroundLight,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(19, 91, 236, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextWrap: {
    flex: 1,
    flexDirection: "column",
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
});
