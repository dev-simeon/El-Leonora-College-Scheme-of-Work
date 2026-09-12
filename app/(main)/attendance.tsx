import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../src/constants/colors";
import {
  AttendanceAction,
  AttendanceService,
} from "../../src/services/attendanceService";

type AttendancePerson = { id: string; name: string; className?: string };
const STUDENTS: AttendancePerson[] = [
  { id: "2024-0891", name: "Julian Alexander", className: "SS 3" },
  { id: "2024-1102", name: "Sophia Chen", className: "SS 3" },
  { id: "2024-0453", name: "Marcus Sterling", className: "SS 2" },
  { id: "2024-0922", name: "Elena Rodriguez", className: "JSS 3" },
  { id: "2024-0711", name: "David Okafor", className: "SS 1" },
  { id: "2024-0344", name: "Zoe Takahashi", className: "JSS 2" },
];
const STAFF: AttendancePerson[] = [
  { id: "STF-2024-001", name: "Dr. Sarah Johnson" },
  { id: "STF-2024-002", name: "Prof. Michael Smith" },
];
const REASONS = [
  "Medical Appointment",
  "Official Assignment",
  "Personal Errand",
  "School Activity Outside Campus",
  "Emergency",
  "Parent Pickup",
  "Other",
] as const;
type CheckoutOption = "day" | "reason";
type SuccessAction = Exclude<AttendanceAction, "check_out_required">;

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<"Students" | "Staff">("Students");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [success, setSuccess] = useState<{
    action: SuccessAction;
    timestamp: Date;
    reason?: string;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [option, setOption] = useState<CheckoutOption | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
  const scanLock = useRef(false);
  const list = activeTab === "Students" ? STUDENTS : STAFF;
  const summary = activeTab === "Students" ? "6/42" : "2/12";
  const resetCheckout = () => {
    setOption(null);
    setReason(null);
    setOtherReason("");
    setReasonMenuOpen(false);
  };
  const dismissSuccess = () => {
    scanLock.current = false;
    setLoading(false);
    setSuccess(null);
    setUserId(null);
    resetCheckout();
  };
  const openScanner = async () => {
    scanLock.current = false;
    setLoading(false);
    if (!permission) return;
    if (!permission.granted && !(await requestPermission()).granted) return;
    scanLock.current = false;
    setScannerOpen(true);
  };
  const scan = async ({ data }: { data: string }) => {
    const id = data.trim();
    if (!id || scanLock.current) return;
    scanLock.current = true;
    setUserId(id);
    setLoading(true);
    try {
      const response = await AttendanceService.scanAttendance(id);
      setScannerOpen(false);
      if (response.action === "check_out_required") {
        resetCheckout();
        setCheckoutOpen(true);
      } else
        setSuccess({
          action: "check_in",
          timestamp:
            AttendanceService.getLatestLog(id)?.timestamp ?? new Date(),
        });
    } finally {
      setLoading(false);
      scanLock.current = false;
    }
  };
  const selectedReason = reason === "Other" ? otherReason.trim() : reason;
  const canSubmit =
    option === "day" || (option === "reason" && Boolean(selectedReason));
  const submitCheckout = async () => {
    if (!userId || !option || !canSubmit) return;
    setLoading(true);
    try {
      const response =
        option === "day"
          ? await AttendanceService.checkOutForDay(userId)
          : await AttendanceService.checkOutForReason(userId, selectedReason!);
      setCheckoutOpen(false);
      setSuccess({
        action: response.action as SuccessAction,
        timestamp:
          AttendanceService.getLatestLog(userId)?.timestamp ?? new Date(),
        reason: option === "reason" ? (selectedReason ?? undefined) : undefined,
      });
    } finally {
      setLoading(false);
    }
  };
  const copy =
    success?.action === "check_in"
      ? [
          "Check-In Successful",
          "Your attendance has been recorded successfully.",
        ]
      : success?.action === "check_out_day"
        ? ["Checked Out Successfully", "Have a safe trip home."]
        : [
            "Temporary Check-Out Recorded",
            "Remember to check back in when you return to school.",
          ];
  const time = success?.timestamp.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerSpace} />
        <Text style={styles.headerTitle}>Attendance List</Text>
        <View style={styles.headerSpace} />
      </View>
      <View style={styles.tabsContainer}>
        <View style={styles.filterTabs}>
          {(["Students", "Staff"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TODAY'S ATTENDANCE</Text>
              <Text style={styles.summaryValue}>{summary}</Text>
              <Ionicons
                name="school"
                size={120}
                color="rgba(255,255,255,0.1)"
                style={styles.summaryIcon}
              />
            </View>
            <Text style={styles.listTitle}>Attendance Register</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.attendanceCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userId}>{item.id}</Text>
            </View>
            {item.className && (
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>{item.className}</Text>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.loadMore}>
            <Text style={styles.loadMoreText}>
              Load more {activeTab.toLowerCase()}
            </Text>
          </TouchableOpacity>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom - 10, 18) }]}
        onPress={openScanner}
      >
        <Ionicons name="camera" size={20} color="#FFF" />
        <Text style={styles.fabText}>Scan QR Code</Text>
      </TouchableOpacity>

      <Modal
        visible={scannerOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => !loading && setScannerOpen(false)}
      >
        <View style={styles.camera}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanLock.current ? undefined : scan}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.cameraShade}>
            <View style={styles.viewfinder} />
            <TouchableOpacity
              style={[styles.close, { top: insets.top + 20 }]}
              onPress={() => !loading && setScannerOpen(false)}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerText}>
              Center the QR code within the frame
            </Text>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Recording attendance...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={checkoutOpen}
        transparent
        animationType="slide"
        onRequestClose={() => !loading && setCheckoutOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.dismiss}
            onPress={() => !loading && setCheckoutOpen(false)}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Check Out Attendance</Text>
            <Text style={styles.sheetSub}>
              You've already checked in today. What would you like to do?
            </Text>
            <Choice
              active={option === "day"}
              title="Check Out for the Day"
              onPress={() => setOption("day")}
            />
            <Choice
              active={option === "reason"}
              title="Check Out for Another Reason"
              description="I'm temporarily leaving school."
              onPress={() => setOption("reason")}
            />
            {option === "reason" && (
              <View style={styles.reasonBox}>
                <Text style={styles.inputLabel}>Checkout reason</Text>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => setReasonMenuOpen(!reasonMenuOpen)}
                >
                  <Text style={reason ? styles.selectText : styles.placeholder}>
                    {reason ?? "Select a reason"}
                  </Text>
                  <Ionicons
                    name={reasonMenuOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
                {reasonMenuOpen && (
                  <View style={styles.menu}>
                    {REASONS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.menuItem}
                        onPress={() => {
                          setReason(item);
                          setReasonMenuOpen(false);
                        }}
                      >
                        <Text style={styles.menuText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {reason === "Other" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter reason"
                    placeholderTextColor="#9CA3AF"
                    value={otherReason}
                    onChangeText={setOtherReason}
                  />
                )}
              </View>
            )}
            <TouchableOpacity
              style={[styles.submit, !canSubmit && styles.disabled]}
              disabled={!canSubmit || loading}
              onPress={submitCheckout}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Submit Check Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(success)} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={42} color="#FFF" />
            </View>
            <Text style={styles.successTitle}>{copy[0]}</Text>
            <Text style={styles.successBody}>{copy[1]}</Text>
            {success?.reason && (
              <Text style={styles.reasonText}>Reason: {success.reason}</Text>
            )}
            <Text style={styles.timeText}>
              {success?.action === "check_in" ? "Check-in" : "Check-out"} time:{" "}
              {time}
            </Text>
            <TouchableOpacity style={styles.done} onPress={dismissSuccess}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Choice({
  active,
  title,
  description,
  onPress,
}: {
  active: boolean;
  title: string;
  description?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.choice, active && styles.choiceActive]}
      onPress={onPress}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.dot} />}
      </View>
      <View style={styles.choiceText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {description ? (
          <Text style={styles.choiceSub}>{description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerSpace: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  tabsContainer: { paddingHorizontal: 20, paddingVertical: 16 },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#FFF", elevation: 2 },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    fontFamily: "Lexend",
  },
  activeTabText: { color: "#0F172A" },
  listContent: { paddingHorizontal: 20, paddingTop: 10 },
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    height: 140,
    marginBottom: 24,
    overflow: "hidden",
  },
  summaryLabel: {
    color: "rgba(255,255,255,.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Lexend",
  },
  summaryValue: {
    color: "#FFF",
    fontSize: 56,
    fontWeight: "800",
    marginTop: 4,
    fontFamily: "Lexend",
  },
  summaryIcon: { position: "absolute", right: -15, bottom: -15 },
  listTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#191c1d",
    fontFamily: "Lexend",
    marginBottom: 16,
  },
  attendanceCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DAE2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: "Lexend",
  },
  cardText: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    fontFamily: "Lexend",
  },
  userId: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontFamily: "Lexend",
  },
  classBadge: {
    backgroundColor: "#DAE2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0040A1",
    fontFamily: "Lexend",
  },
  loadMore: {
    backgroundColor: "#e7e8e9",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424654",
    fontFamily: "Lexend",
  },
  fab: {
    position: "absolute",
    right: 24,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 99,
    gap: 8,
    elevation: 8,
  },
  fabText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Lexend",
  },
  camera: { flex: 1, backgroundColor: "#000" },
  cameraShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FFF",
    borderRadius: 16,
  },
  close: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(0,0,0,.6)",
    padding: 8,
    borderRadius: 20,
  },
  scannerText: {
    position: "absolute",
    bottom: 100,
    backgroundColor: "rgba(0,0,0,.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.4)",
    justifyContent: "flex-end",
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  sheetSub: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    fontFamily: "Lexend",
  },
  choice: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  choiceActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(10,132,255,.06)",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioActive: { borderColor: COLORS.primary },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  choiceText: { flex: 1, marginLeft: 12 },
  choiceTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Lexend",
  },
  choiceSub: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontFamily: "Lexend",
  },
  reasonBox: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    fontFamily: "Lexend",
    marginBottom: 8,
  },
  select: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#0F172A", fontFamily: "Lexend" },
  placeholder: { color: "#9CA3AF", fontFamily: "Lexend" },
  menu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuText: { color: "#0F172A", fontFamily: "Lexend" },
  input: {
    marginTop: 12,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  submit: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  disabled: { opacity: 0.45 },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Lexend",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.46)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  success: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.statusCompleted,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  successBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    fontFamily: "Lexend",
    textAlign: "center",
  },
  reasonText: {
    marginTop: 16,
    color: "#0F172A",
    fontWeight: "600",
    fontFamily: "Lexend",
  },
  timeText: { marginTop: 16, color: "#64748B", fontFamily: "Lexend" },
  done: {
    marginTop: 24,
    minHeight: 52,
    width: "100%",
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
