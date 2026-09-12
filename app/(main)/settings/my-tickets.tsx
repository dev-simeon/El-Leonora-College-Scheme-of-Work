import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BackButton } from "../../../src/components/BackButton";
import { COLORS } from "../../../src/constants/colors";
import { useAuth } from "../../../src/context/AuthContext";
import CreateTicketModal from "../../../src/components/CreateTicketModal";

interface Ticket {
  id: string;
  ticketNumber: string;
  status: "in_progress" | "resolved";
  title: string;
  date: string;
}

const TICKET_DATA: Ticket[] = [
  {
    id: "1",
    ticketNumber: "#EL-1024",
    status: "in_progress",
    title: "Unable to upload mid-term science assessment files",
    date: "Oct 24, 2023 • 10:30 AM",
  },
  {
    id: "2",
    ticketNumber: "#EL-1018",
    status: "resolved",
    title: "Scheme of work not showing for Year 9 Chemistry",
    date: "Oct 21, 2023 • 02:15 PM",
  },
  {
    id: "3",
    ticketNumber: "#EL-0982",
    status: "resolved",
    title: "Attendance register reset after submission",
    date: "Oct 15, 2023 • 09:00 AM",
  },
  {
    id: "4",
    ticketNumber: "#EL-1031",
    status: "in_progress",
    title: "Password reset link not received in email",
    date: "Oct 26, 2023 • 04:45 PM",
  },
];

export default function MyTicketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const handleCreateTicket = () => {
    setModalVisible(true);
  };

  const handleSubmitTicket = (subject: string, description: string) => {
    // TODO: Wire up to real tickets API endpoint
    void subject; void description;
  };

  const handleTicketPress = (_ticketId: string) => {
    // TODO: Navigate to ticket detail screen
  };

  const renderStatusBadge = (status: "in_progress" | "resolved") => {
    const isInProgress = status === "in_progress";
    return (
      <View
        style={[
          styles.statusBadge,
          isInProgress ? styles.statusInProgress : styles.statusResolved,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            isInProgress
              ? styles.statusTextInProgress
              : styles.statusTextResolved,
          ]}
        >
          {isInProgress ? "IN PROGRESS" : "RESOLVED"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar
        style="dark"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView style={styles.safeContainer} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <BackButton onPress={() => router.back()} />
            <Text style={styles.headerTitle}>My Tickets</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Tickets List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ticketsContainer}>
              {TICKET_DATA.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => handleTicketPress(ticket.id)}
                  activeOpacity={0.7}
                >
                  {/* Ticket Header */}
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketNumber}>
                      {ticket.ticketNumber}
                    </Text>
                    {renderStatusBadge(ticket.status)}
                  </View>

                  {/* Ticket Title */}
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>

                  {/* Ticket Footer */}
                  <View style={styles.ticketFooter}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.ticketDate}>{ticket.date}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Floating Action Button - Only for Staff with Admin Officer role */}
          {(user?.role === "staff" && user?.backendRole?.toLowerCase() === "admin officer") && (
            <TouchableOpacity
              style={styles.fab}
              onPress={handleCreateTicket}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
          )}

          {/* Create Ticket Modal */}
          <CreateTicketModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSubmit={handleSubmitTicket}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  safeContainer: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  ticketsContainer: {
    gap: 16,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#135BEC",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  statusInProgress: {
    backgroundColor: "#FFEDD5",
  },
  statusResolved: {
    backgroundColor: "#DCFCE7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusTextInProgress: {
    color: "#C2410C",
  },
  statusTextResolved: {
    color: "#15803D",
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 19,
    color: "#0F172A",
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ticketDate: {
    fontSize: 12,
    color: "#64748B",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#135BEC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
});
