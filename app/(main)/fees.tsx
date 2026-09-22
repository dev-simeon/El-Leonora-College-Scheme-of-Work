import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router/react-navigation";
import { COLORS } from "../../src/constants/colors";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { AccountApi } from "../../src/api/generated/endpoints/account-api";
import { ClassesApi } from "../../src/api/generated/endpoints/classes-api";
import { Configuration } from "../../src/api/generated/configuration";
import api, { API_BASE_URL } from "../../src/services/api";
import { getApiErrorMessage, getRequestErrorMessage } from "../../src/utils/apiError";
import { useToast } from "../../src/context/ToastContext";

// ─── API Clients ──────────────────────────────────────────────────────────────
const accountApi = new AccountApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const classesApi = new ClassesApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeItem {
  label: string;
  amount: number;
  paid: number;
  icon: string;
  color: string;
  bg: string;
}

interface PaymentRecord {
  id: string;
  label: string;
  amount: number;
  date: string;
  method: string;
  status: "Success" | "Pending" | "Failed";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (val: number) =>
  `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const statusColor = (s: PaymentRecord["status"]) => {
  if (s === "Success") return { bg: "#DCFCE7", text: "#15803D" };
  if (s === "Pending") return { bg: "#FEF9C3", text: "#854D0E" };
  return { bg: "#FEE2E2", text: "#DC2626" };
};

const methodIcon = (m: string): any => {
  if (m === "Card") return "card-outline";
  if (m === "Transfer") return "swap-horizontal-outline";
  return "cash-outline";
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const FeeBreakdownCard = ({ item }: { item: FeeItem }) => {
  const pct =
    item.amount > 0 ? Math.min((item.paid / item.amount) * 100, 100) : 0;
  const balance = item.amount - item.paid;
  return (
    <View style={styles.breakdownCard}>
      <View style={[styles.breakdownIcon, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color} />
      </View>
      <View style={styles.breakdownBody}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{item.label}</Text>
          <Text style={styles.breakdownTotal}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%` as any, backgroundColor: item.color },
            ]}
          />
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownPaid}>
            Paid: {formatCurrency(item.paid)}
          </Text>
          <Text
            style={[
              styles.breakdownBalance,
              balance > 0 && { color: "#EF4444" },
            ]}
          >
            {balance > 0 ? `Bal: ${formatCurrency(balance)}` : "✓ Cleared"}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Ledger Row ──────────────────────────────────────────────────────────────
const LedgerRow = ({ rec }: { rec: PaymentRecord }) => {
  const isPending = rec.status === "Pending";
  const amountColor = isPending ? "#DC2626" : "#16A34A";
  return (
    <View style={styles.paymentRow}>
      <View
        style={[
          styles.paymentIconWrap,
          { backgroundColor: isPending ? "#FEF2F2" : "#F0FDF4" },
        ]}
      >
        <Ionicons
          name={isPending ? "time-outline" : "checkmark-circle-outline"}
          size={18}
          color={isPending ? "#DC2626" : "#16A34A"}
        />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentLabel}>{rec.label}</Text>
        <Text style={styles.paymentDate}>
          {isPending ? rec.date : `${rec.date} · ${rec.method}`}
        </Text>
      </View>
      <Text style={[styles.paymentAmount, { color: amountColor }]}>
        {isPending
          ? `- ${formatCurrency(rec.amount)}`
          : formatCurrency(rec.amount)}
      </Text>
    </View>
  );
};

// ─── Ledger data (pending first, then paid) ──────────────────────────────────
// Pending entries show first; paid entries follow in chronological order.
// Both Pending and paid for the same fee appear together once the pending
// is resolved — but all pending items always float to the top.
const MOCK_LEDGER: PaymentRecord[] = [
  // ── Pending (outstanding) ─────────────────────────────────────
  {
    id: "l1",
    label: "Development Levy",
    amount: 5000,
    date: "Due: Apr 30, 2025",
    method: "—",
    status: "Pending",
  },
  {
    id: "l2",
    label: "ICT / Lab Fee",
    amount: 5000,
    date: "Due: Apr 30, 2025",
    method: "—",
    status: "Pending",
  },
  {
    id: "l3",
    label: "Sports & Activities",
    amount: 8000,
    date: "Due: Apr 30, 2025",
    method: "—",
    status: "Pending",
  },
  // ── Paid ──────────────────────────────────────────────────────
  {
    id: "l4",
    label: "Tuition Fee – Term 1",
    amount: 85000,
    date: "Jan 12, 2025",
    method: "Transfer",
    status: "Success",
  },
  {
    id: "l5",
    label: "Development Levy – Part",
    amount: 10000,
    date: "Jan 14, 2025",
    method: "Cash",
    status: "Success",
  },
  {
    id: "l6",
    label: "Exam / WAEC Fee",
    amount: 25000,
    date: "Feb 3, 2025",
    method: "Card",
    status: "Success",
  },
  {
    id: "l7",
    label: "ICT Fee – Part",
    amount: 5000,
    date: "Mar 1, 2025",
    method: "Transfer",
    status: "Success",
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FeesScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const router = useRouter();

  const isStudent = user?.role === "student";

  // ── Guard: non-students cannot access this screen ────────────────────────
  useEffect(() => {
    if (user && !isStudent) {
      router.replace("/(main)/home/");
    }
  }, [user]);

  const { showToast } = useToast();

  if (!user || !isStudent) return null;

  // Fetch student profile to get classId
  const {
    data: profileData,
    isPending: profileLoading,
    refetch: refetchProfile,
    isRefetching,
  } = useQuery({
    queryKey: ["profile", user?.id ?? "anon"],
    queryFn: async () => {
      const res = await accountApi.getMyProfile();
      if (!res.data.success || !res.data.data)
        throw new Error(getApiErrorMessage(res.data, "Failed"));
      return res.data.data;
    },
    enabled: !!user,
  });

  const classId = profileData?.classInfo?.classId;

  const {
    data: feeStructureRaw,
    isPending: feesLoading,
    isError: isFeesError,
    error: feesQueryError,
    refetch: refetchFees,
  } = useQuery({
    queryKey: ["feeStructure", classId],
    queryFn: async () => {
      const res = await classesApi.getClassFees({ classId: classId! });
      return (res as any).data?.data ?? null;
    },
    enabled: !!classId,
  });

  const isLoading = profileLoading || feesLoading;

  useEffect(() => {
    if (isFeesError && feesQueryError) {
      showToast({ 
        message: getRequestErrorMessage(feesQueryError, "Failed to load fees"), 
        type: "error" 
      });
    }
  }, [isFeesError, feesQueryError, showToast]);

  // Ledger: pending always first, then paid
  const ledger = MOCK_LEDGER; // swap for real API data when shape is confirmed
  const totalFees =
    ledger.reduce((s, r) => s + (r.status === "Success" ? r.amount : 0), 0) +
    ledger
      .filter((r) => r.status === "Pending")
      .reduce((s, r) => s + r.amount, 0);
  const totalPaid = ledger
    .filter((r) => r.status === "Success")
    .reduce((s, r) => s + r.amount, 0);
  const totalOwed = ledger
    .filter((r) => r.status === "Pending")
    .reduce((s, r) => s + r.amount, 0);
  const isCleared = totalOwed <= 0;

  const onRefresh = () => {
    refetchProfile();
    refetchFees();
  };

  const displayName = profileData
    ? `${profileData.firstName ?? ""} ${profileData.lastName ?? ""}`.trim()
    : (user?.name ?? "");

  const classLabel = profileData?.classInfo
    ? [profileData.classInfo.classLevel, profileData.classInfo.classCode]
        .filter(Boolean)
        .join(" ")
    : "—";

  return (
    <View style={styles.container}>
      {isFocused && (
        <StatusBar style="light" />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#135BEC"
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#135BEC", "#0E47C4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroName}>{displayName || "—"}</Text>
              {classLabel !== "—" && (
                <View style={styles.heroBadge}>
                  <Ionicons
                    name="school-outline"
                    size={12}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.heroBadgeText}>{classLabel}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.heroStatusBadge,
                { backgroundColor: isCleared ? "#16A34A" : "#DC2626" },
              ]}
            >
              <Text style={styles.heroStatusText}>
                {isCleared ? "Cleared" : "Owing"}
              </Text>
            </View>
          </View>

          {/* Big balance number */}
          <View style={styles.heroCenterBlock}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : (
              <>
                <Text style={styles.heroBalanceLabel}>Outstanding Balance</Text>
                <Text style={styles.heroBalance}>
                  {isCleared ? "₦0.00" : formatCurrency(totalOwed)}
                </Text>
              </>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>TOTAL FEES</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(totalFees)}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>AMOUNT PAID</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>BALANCE DUE</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(Math.max(totalOwed, 0))}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Fee Ledger ────────────────────────────────────────── */}
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color="#135BEC" style={{ marginTop: 40 }} />
          ) : ledger.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No fee records found</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <View style={styles.historyCard}>
                {ledger.map((rec, i) => (
                  <React.Fragment key={rec.id}>
                    <LedgerRow rec={rec} />
                    {i < ledger.length - 1 && (
                      <View style={styles.rowDivider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7FF" },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: { paddingBottom: 0, overflow: "hidden" },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  heroGreeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: "Lexend",
  },
  heroName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 2,
    fontFamily: "Lexend",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Lexend",
  },
  heroStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
    fontFamily: "Lexend",
  },

  heroCenterBlock: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  heroBalanceLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "Lexend",
  },
  heroBalance: {
    fontSize: 44,
    fontWeight: "800",
    color: "#FFF",
    fontFamily: "Lexend",
    letterSpacing: -1,
  },

  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 60,
    alignSelf: "stretch",
    marginHorizontal: 20,
  },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: "Lexend",
  },
  heroStatValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
    fontFamily: "Lexend",
  },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  heroProgressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  heroProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 99,
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: 99,
  },
  heroProgressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Lexend",
  },

  heroCurve: {
    alignSelf: "stretch",
    height: 20,
    backgroundColor: "#F0F7FF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabsWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  tabPill: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    fontFamily: "Lexend",
  },
  tabBtnTextActive: { color: "#135BEC" },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 16,
    marginTop: -28,
    gap: 8,
    backgroundColor: "#F0F7FF",
    zIndex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
    paddingLeft: 2,
    fontFamily: "Lexend",
  },

  // Breakdown cards
  breakdownCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  breakdownIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownBody: { flex: 1 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  breakdownTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 99 },
  breakdownPaid: { fontSize: 12, color: "#64748B", fontFamily: "Lexend" },
  breakdownBalance: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22C55E",
    fontFamily: "Lexend",
  },

  // Notice
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 4,
    marginBottom: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: "#1D4ED8",
    lineHeight: 19,
    fontFamily: "Lexend",
  },

  // History
  historyCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF2",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  paymentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: { flex: 1 },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  paymentDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
    fontFamily: "Lexend",
  },
  paymentRight: { alignItems: "flex-end", gap: 4 },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "Lexend",
  },
  paymentStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  paymentStatusText: { fontSize: 11, fontWeight: "700", fontFamily: "Lexend" },
  rowDivider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 68 },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#94A3B8", fontFamily: "Lexend" },
});
