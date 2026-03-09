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
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { BackButton } from "../../../src/components/BackButton";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    question: "How to access my scheme of work?",
    answer:
      'To access your scheme of work, navigate to the Dashboard and select the "Curriculum" tab. From there, you can choose your specific subject and year group to view or download the detailed scheme.',
  },
  {
    id: "2",
    question: "Updating student attendance",
    answer: "Attendance can be updated by selecting your class from the dashboard and clicking on the 'Attendance' icon. Mark students as present or absent and save.",
  },
  {
    id: "3",
    question: "Trouble uploading assessment files",
    answer: "Ensure your file is in PDF or DOCX format and does not exceed 10MB. If issues persist, check your internet connection or submit a support ticket.",
  },
  {
    id: "4",
    question: "Resetting my account password",
    answer: "Go to Settings > Change Password to update your password. If you've forgotten it, contact the ICT department for a reset code.",
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["left", "right"]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            {/* FAQ Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                FREQUENTLY ASKED QUESTIONS
              </Text>

              <View style={styles.faqCard}>
                {FAQ_DATA.map((item, index) => {
                  const isExpanded = expandedId === item.id;
                  const isFirst = index === 0;

                  return (
                    <View key={item.id}>
                      {!isFirst && <View style={styles.divider} />}

                      <TouchableOpacity
                        style={[
                          styles.faqItem,
                          isExpanded && styles.faqItemExpanded,
                        ]}
                        onPress={() => toggleFAQ(item.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.faqHeader,
                            isExpanded && styles.faqHeaderExpanded,
                          ]}
                        >
                          <Text
                            style={[
                              styles.faqQuestion,
                              isExpanded && styles.faqQuestionExpanded,
                            ]}
                          >
                            {item.question}
                          </Text>
                          <View style={styles.iconContainer}>
                            <Ionicons 
                              name={isExpanded ? "chevron-down" : "chevron-forward"} 
                              size={20} 
                              color={isExpanded ? COLORS.primary : "#9CA3AF"} 
                            />
                          </View>
                        </View>

                        {isExpanded && item.answer && (
                          <View style={styles.faqAnswer}>
                            <Text style={styles.faqAnswerText}>
                              {item.answer}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Support Ticket Link */}
              <TouchableOpacity
                style={styles.ticketLinkContainer}
                onPress={() => router.push("/(main)/settings/my-tickets")}
                activeOpacity={0.7}
              >
                <Text style={styles.ticketLinkText}>
                  Your question not answered?{" "}
                  <Text style={styles.ticketLinkHighlight}>
                    Click here to submit a ticket
                  </Text>
                </Text>
              </TouchableOpacity>
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
    paddingBottom: 24,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  ticketLinkContainer: {
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  ticketLinkText: {
    fontSize: 14,
    color: "#1E293B",
    textAlign: "left",
  },
  ticketLinkHighlight: {
    fontWeight: "700",
    color: "#135BEC",
    textDecorationLine: "underline",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#135BEC",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
  },
  faqItemExpanded: {
    backgroundColor: "#F9FAFB",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  faqHeaderExpanded: {
    paddingBottom: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  faqQuestionExpanded: {
    fontWeight: "700",
    color: "#135BEC",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
});
