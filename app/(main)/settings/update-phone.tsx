import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../../../src/context/ToastContext";
import { BackButton } from "../../../src/components/BackButton";
import { getRequestErrorMessage } from "../../../src/utils/apiError";

const validateNigerianPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\s/g, "");
  const nigerianPhoneRegex = /^(\+234|0|234)[789]\d{9}$/;
  return nigerianPhoneRegex.test(cleaned);
};

export default function UpdatePhoneScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    setNewPhone(text);
    if (phoneError) setPhoneError("");
  };

  const handleUpdate = async () => {
    if (!oldPhone.trim()) {
      showToast({ message: "Please enter your old phone number.", type: "error" });
      return;
    }
    if (!validateNigerianPhoneNumber(oldPhone)) {
      setPhoneError(
        "Enter a valid Nigerian number (e.g. +234 800 000 0000 or 08012345678)",
      );
      return;
    }
    if (!newPhone.trim()) {
      showToast({ message: "Please enter your new phone number.", type: "error" });
      return;
    }
    if (!validateNigerianPhoneNumber(newPhone)) {
      setPhoneError(
        "Enter a valid Nigerian number (e.g. +234 800 000 0000 or 08012345678)",
      );
      return;
    }
    if (oldPhone.replace(/\s/g, "") === newPhone.replace(/\s/g, "")) {
      showToast({ message: "Your old and new phone numbers cannot be the same.", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));
      setIsLoading(false);
      showToast({ message: "Your phone number has been updated successfully.", type: "success" });
      router.back();
    } catch (error) {
      setIsLoading(false);
      showToast({ message: getRequestErrorMessage(error, "Failed to update phone number. Please try again."), type: "error" });
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />
      <SafeAreaView
        style={styles.safeAreaContent}
        edges={["left", "right"]}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <BackButton onPress={() => router.back()} />
            <Text style={styles.headerTitle}>Update Phone Number</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Icon Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoBackground}>
                <MaterialCommunityIcons
                  name="phone-sync"
                  size={48}
                  color="#135BEC"
                />
              </View>
              <Text style={styles.logoText}>Update Your Phone</Text>
              <Text style={styles.description}>
                Enter your old phone number and your new Nigerian phone number.
                {"\n"}
                Both numbers must be valid.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Old Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Old Phone Number</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconLeft}>
                    <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="+234 800 000 0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={oldPhone}
                    onChangeText={setOldPhone}
                  />
                </View>
              </View>

              {/* New Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>New Phone Number</Text>
                <View
                  style={[
                    styles.inputContainer,
                    phoneError ? styles.inputContainerError : null,
                  ]}
                >
                  <View style={styles.inputIconLeft}>
                    <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="+234 800 000 0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={newPhone}
                    onChangeText={handlePhoneChange}
                  />
                </View>
                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : null}
              </View>
            </View>

            {/* Info hint */}
            <View style={styles.hintRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#94A3B8"
              />
              <Text style={styles.hintText}>
                Accepted formats: 08XXXXXXXXX or +234XXXXXXXXXX
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <Pressable
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleUpdate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitButtonText}>
                      Update Phone Number
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  safeAreaContent: {
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    gap: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 52,
    paddingHorizontal: 4,
  },
  inputContainerError: {
    borderColor: "#EF4444",
  },
  inputIconLeft: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    lineHeight: 16,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  hintText: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
    flex: 1,
  },
  actionsSection: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: "#135BEC",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
    paddingVertical: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
