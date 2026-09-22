import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { AccountApi } from "../../api/generated/endpoints/account-api";
import { Configuration } from "../../api/generated/configuration";
import api, { API_BASE_URL } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { UpcomingActivitiesCard } from "./UpcomingActivitiesCard";

// ─── API Clients ──────────────────────────────────────────────────────────────
const accountApi = new AccountApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api
);

// Stitch Design Tokens
const STITCH_COLORS = {
  primary: "#0040a1",
  primaryContainer: "#0056d2",
  onPrimaryContainer: "#ccd8ff",
  surface: "#f8f9fa",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainerHigh: "#e7e8e9",
  onSurface: "#191c1d",
  onSurfaceVariant: "#424654",
  outlineVariant: "#c3c6d6",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  tertiary: "#822800",
  secondaryContainer: "#b3c5fd",
  onSecondaryContainer: "#3e5181",
};

export default function StudentDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  // Fetch actual profile data (cached by React Query)
  const { data: profileData = null } = useQuery({
    queryKey: ["profile", user?.id || "anonymous"],
    queryFn: async () => {
      const response = await accountApi.getMyProfile();
      if (!response.data.success || !response.data.data) {
        throw new Error(getApiErrorMessage(response.data, "Failed to load profile"));
      }
      return response.data.data;
    },
    enabled: !!user,
  });

  const firstName = profileData?.firstName || user?.name?.split(' ')[0] || "Student";
  
  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [isActivitiesModalVisible, setActivitiesModalVisible] = useState(false);

  const handleNavigateToSubjects = () => {
    router.push("/(main)/home/subjects");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 20) }
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: "https://api.dicebear.com/7.x/avataaars/png?seed=" + firstName }}
            style={styles.avatar}
          />
        </View>
        <Pressable style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={STITCH_COLORS.primary} />
          <View style={styles.notificationBadge} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Greeting Section */}
        <View style={styles.mainGreeting}>
          <Text style={styles.greetingTitle}>
            Good Morning, {firstName}
          </Text>
          <Text style={styles.greetingSubtitle}>
            {user?.currentTerm || "Current Term"} • 3 Classes Left
          </Text>
        </View>

        {/* 1. Attendance Hero */}
        <View style={[styles.card, styles.heroCard]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Attendance</Text>
              <Text style={styles.cardSubtitle}>This Month</Text>
            </View>
            <View style={styles.iconContainerPrimary}>
              <Ionicons name="checkmark-circle-outline" size={20} color={STITCH_COLORS.primary} />
            </View>
          </View>

          <View style={styles.heroMiddle}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>94%</Text>
            </View>
            <View style={styles.streakContainer}>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={20} color={STITCH_COLORS.tertiary} />
                <Text style={styles.streakText}>12 Day Streak</Text>
              </View>
              <Text style={styles.streakSubtext}>Excellent consistency.</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
              <View key={index} style={styles.chartBarWrapper}>
                <View style={[
                  styles.chartBar, 
                  index === 4 ? { height: '50%', backgroundColor: STITCH_COLORS.surfaceContainerHigh } : { height: '100%' }
                ]} />
                <Text style={styles.chartDayText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Today's Schedule Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Today's Schedule</Text>
            </View>
            <Pressable onPress={() => setScheduleModalVisible(true)} style={styles.viewAllBtn}>
              <Text style={styles.linkText}>View All</Text>
            </Pressable>
          </View>

          <Pressable style={styles.ongoingClassCard} onPress={() => setScheduleModalVisible(true)}>
            <View style={styles.ongoingHeader}>
              <View style={styles.ongoingLeft}>
                <View style={styles.ongoingIcon}>
                  <Ionicons name="calculator" size={24} color={STITCH_COLORS.onPrimaryContainer} />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>ONGOING</Text>
                  </View>
                  <Text style={styles.ongoingTitle}>Mathematics</Text>
                  <Text style={styles.ongoingSubtitle}>Mr. Benson • Room 4B • 09:00 - 10:00</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '65%' }]} />
            </View>
            
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTimeText}>40m elapsed</Text>
              <Text style={styles.progressTimeText}>20m remaining</Text>
            </View>
          </Pressable>
        </View>

        {/* 3. Upcoming Activities */}
        <UpcomingActivitiesCard />

        {/* 4. Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContainer}>
            <Pressable style={styles.actionItem} onPress={handleNavigateToSubjects}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="library-outline" size={24} color={STITCH_COLORS.primary} />
              </View>
              <Text style={styles.actionText}>My Subjects</Text>
            </Pressable>

            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar-outline" size={24} color={STITCH_COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Timetable</Text>
            </Pressable>

            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="document-text-outline" size={24} color={STITCH_COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Notes</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* 5. Assignments */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Assignments</Text>
          </View>

          <View style={styles.assignmentItemHigh}>
            <View style={styles.assignmentIconHigh}>
              <Ionicons name="warning" size={20} color={STITCH_COLORS.error} />
            </View>
            <View style={styles.assignmentContent}>
              <Text style={styles.assignmentTitle}>English Literature Essay</Text>
              <Text style={styles.assignmentMeta}>
                <Ionicons name="time-outline" size={12} /> Due Today • <Text style={{ color: STITCH_COLORS.error }}>Priority: High</Text>
              </Text>
            </View>
          </View>

          <View style={styles.assignmentItemNormal}>
            <View style={styles.assignmentIconNormal}>
              <Ionicons name="checkmark-circle" size={20} color={STITCH_COLORS.primary} />
            </View>
            <View style={styles.assignmentContent}>
              <Text style={[styles.assignmentTitle, styles.strikeThrough]}>History Quiz</Text>
              <Text style={styles.assignmentMeta}>
                <Text style={{ color: STITCH_COLORS.primary }}><Ionicons name="checkmark-done" size={12} /> Submitted</Text> • Yesterday
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Remaining Classes Modal */}
      <Modal
        visible={isScheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setScheduleModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remaining Classes</Text>
              <Pressable onPress={() => setScheduleModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={STITCH_COLORS.onSurfaceVariant} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.remainingClassItem}>
                <View style={styles.remainingClassIcon}>
                  <Ionicons name="flask-outline" size={24} color={STITCH_COLORS.onSurface} />
                </View>
                <View style={styles.remainingClassInfo}>
                  <Text style={styles.remainingClassTime}>10:15 - 11:15</Text>
                  <Text style={styles.remainingClassName}>Basic Science</Text>
                  <Text style={styles.remainingClassRoom}>Room 2A</Text>
                </View>
              </View>

              <View style={styles.remainingClassItem}>
                <View style={styles.remainingClassIcon}>
                  <Ionicons name="book-outline" size={24} color={STITCH_COLORS.onSurface} />
                </View>
                <View style={styles.remainingClassInfo}>
                  <Text style={styles.remainingClassTime}>11:30 - 12:30</Text>
                  <Text style={styles.remainingClassName}>English Literature</Text>
                  <Text style={styles.remainingClassRoom}>Room 1B</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upcoming Activities Modal */}
      <Modal
        visible={isActivitiesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActivitiesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActivitiesModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upcoming Activities</Text>
              <Pressable onPress={() => setActivitiesModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={STITCH_COLORS.onSurfaceVariant} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.remainingClassItem}>
                <View style={styles.remainingClassIcon}>
                  <Ionicons name="timer-outline" size={24} color={STITCH_COLORS.onSurface} />
                </View>
                <View style={styles.remainingClassInfo}>
                  <Text style={styles.remainingClassTime}>Oct 12 • 09:00 AM</Text>
                  <Text style={styles.remainingClassName}>Science Mid-term</Text>
                  <Text style={styles.remainingClassRoom}>Room 1C • Comprehensive Exam</Text>
                </View>
              </View>

              <View style={styles.remainingClassItem}>
                <View style={styles.remainingClassIcon}>
                  <Ionicons name="football-outline" size={24} color={STITCH_COLORS.onSurface} />
                </View>
                <View style={styles.remainingClassInfo}>
                  <Text style={styles.remainingClassTime}>Oct 15 • 03:00 PM</Text>
                  <Text style={styles.remainingClassName}>Inter-House Sports</Text>
                  <Text style={styles.remainingClassRoom}>Main Field</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STITCH_COLORS.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 16,
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STITCH_COLORS.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: "rgba(195, 198, 214, 0.15)",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: STITCH_COLORS.error,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: STITCH_COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 24,
  },
  mainGreeting: {
    marginBottom: -4,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: STITCH_COLORS.onSurface,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: STITCH_COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  card: {
    backgroundColor: STITCH_COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: STITCH_COLORS.onSurface,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: STITCH_COLORS.onSurfaceVariant,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  iconContainerPrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 64, 161, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroMiddle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginBottom: 24,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: STITCH_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 22,
    fontWeight: "700",
    color: STITCH_COLORS.onSurface,
  },
  streakContainer: {
    justifyContent: "center",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "500",
    color: STITCH_COLORS.onSurface,
  },
  streakSubtext: {
    fontSize: 12,
    color: STITCH_COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 60,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(195, 198, 214, 0.15)",
  },
  chartBarWrapper: {
    alignItems: "center",
    gap: 4,
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBar: {
    width: 12,
    backgroundColor: STITCH_COLORS.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartDayText: {
    fontSize: 10,
    fontWeight: "500",
    color: STITCH_COLORS.onSurfaceVariant,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: STITCH_COLORS.onSurface,
    paddingHorizontal: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 4,
    gap: 16,
  },
  actionItem: {
    alignItems: "center",
    gap: 8,
    width: 70,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: STITCH_COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 214, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "400",
    color: STITCH_COLORS.onSurface,
    textAlign: "center",
  },
  ongoingClassCard: {
    backgroundColor: "rgba(0, 64, 161, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 64, 161, 0.1)",
  },
  ongoingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  ongoingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ongoingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: STITCH_COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  ongoingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: STITCH_COLORS.primary,
  },
  ongoingSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: STITCH_COLORS.onSurfaceVariant,
  },
  statusBadge: {
    backgroundColor: "rgba(0, 64, 161, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: STITCH_COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: STITCH_COLORS.surfaceContainerHigh,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: STITCH_COLORS.primary,
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTimeText: {
    fontSize: 12,
    fontWeight: "400",
    color: STITCH_COLORS.onSurfaceVariant,
  },
  activityCard: {
    backgroundColor: STITCH_COLORS.primaryContainer,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countdownItem: {
    alignItems: "center",
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  countdownLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 1,
  },
  countdownDivider: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "400",
    color: STITCH_COLORS.primary,
  },
  assignmentItemHigh: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
    backgroundColor: "rgba(255, 218, 214, 0.2)", // error-container with opacity
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.1)", // error with opacity
    borderLeftWidth: 4,
    borderLeftColor: STITCH_COLORS.error,
    marginBottom: 16,
  },
  assignmentIconHigh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STITCH_COLORS.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  assignmentContent: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: STITCH_COLORS.onSurface,
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 12,
    fontWeight: "400",
    color: STITCH_COLORS.onSurfaceVariant,
  },
  assignmentItemNormal: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
    backgroundColor: STITCH_COLORS.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 214, 0.15)",
  },
  assignmentIconNormal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STITCH_COLORS.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  strikeThrough: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: STITCH_COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    maxHeight: "80%",
  },
  modalDragIndicator: {
    width: 48,
    height: 6,
    backgroundColor: "rgba(195, 198, 214, 0.5)",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: STITCH_COLORS.onSurface,
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: STITCH_COLORS.surfaceContainerLow,
    borderRadius: 20,
  },
  modalBody: {
    gap: 12,
  },
  remainingClassItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    backgroundColor: STITCH_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(195, 198, 214, 0.15)",
  },
  remainingClassIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: STITCH_COLORS.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  remainingClassInfo: {
    flex: 1,
  },
  remainingClassTime: {
    fontSize: 12,
    fontWeight: "600",
    color: STITCH_COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  remainingClassName: {
    fontSize: 16,
    fontWeight: "600",
    color: STITCH_COLORS.onSurface,
  },
  remainingClassRoom: {
    fontSize: 12,
    color: STITCH_COLORS.onSurfaceVariant,
    marginTop: 2,
  },
});
