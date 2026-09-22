import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { COLORS } from "../../../src/constants/colors";
import { BackButton } from "../../../src/components/BackButton";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEmailPress = () => {
    Linking.openURL("mailto:admin@elleonoacollege.edu");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Your Privacy Matters</Text>
              <Text style={styles.lastUpdated}>
                Last updated: October 24, 2023
              </Text>
            </View>

            {/* Introduction */}
            <Text style={styles.bodyText}>
              At El-Leonoa College, we are committed to protecting the privacy
              and security of our students' and teachers' personal information.
              This Privacy Policy describes how we collect, use, and protect
              your data within the Scheme of Work application.
            </Text>

            {/* Section 1 */}
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.bodyText}>
              To provide you with access to the academic materials, we may
              collect the following information:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>
                • Official name and student/teacher identification number.
              </Text>
              <Text style={styles.listItem}>
                • Academic level, department, and assigned courses.
              </Text>
              <Text style={styles.listItem}>
                • Device information and application usage logs for technical optimization.
              </Text>
              <Text style={styles.listItem}>
                • Activation codes provided by the college administration.
              </Text>
            </View>

            {/* Section 2 */}
            <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
            <Text style={styles.bodyText}>
              The information we collect is used strictly for academic and
              administrative purposes:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>
                • To verify your identity and grant access to specific schemes of work.
              </Text>
              <Text style={styles.listItem}>
                • To track academic progress and resource distribution across departments.
              </Text>
              <Text style={styles.listItem}>
                • To improve the user experience and interface of the mobile application.
              </Text>
              <Text style={styles.listItem}>
                • To send important academic notifications and updates.
              </Text>
            </View>

            {/* Questions Card */}
            <View style={styles.questionsCard}>
              <View style={styles.questionsHeader}>
                <Ionicons name="help-circle-outline" size={24} color="#135BEC" />
                <Text style={styles.questionsTitle}>Questions?</Text>
              </View>
              <Text style={styles.questionsText}>
                If you have any questions regarding this privacy policy, you may
                contact the ICT Department or the College Administrator.
              </Text>
              <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
                <Text style={styles.emailLink}>admin@elleonoacollege.edu</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © 2023 El-Leonoa College Academic Portal.{"\n"}All rights
                reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  lastUpdated: {
    color: "#64748B",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  bodyText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 24,
  },
  listItem: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  questionsCard: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  questionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  questionsTitle: {
    color: "#135BEC",
    fontSize: 20,
    fontWeight: "700",
  },
  questionsText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  emailLink: {
    color: "#135BEC",
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 48,
    alignItems: "center",
  },
  footerText: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
});
