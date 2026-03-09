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
import { useAuth } from "../context/AuthContext";
import { BackButton } from "./BackButton";

interface ChangePasswordFormProps {
  /** When true: no back button, must complete before proceeding */
  isForced: boolean;
  /** Called after a successful password change (before navigation) */
  onSuccess?: () => void;
}

function PasswordField({
  label,
  value,
  onChangeText,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputIconLeft}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? "••••••••"}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
        />
        <Pressable style={styles.inputIconRight} onPress={onToggleShow}>
          <Ionicons
            name={show ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#9CA3AF"
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordForm({
  isForced,
  onSuccess,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeFirstLogin } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Simple password strength
  const getStrength = (p: string): { label: string; color: string; pct: number } => {
    if (!p) return { label: "", color: "#E5E7EB", pct: 0 };
    if (p.length < 6) return { label: "Too short", color: "#EF4444", pct: 25 };
    if (p.length < 8) return { label: "Weak", color: "#F97316", pct: 50 };
    const hasUpper = /[A-Z]/.test(p);
    const hasNum = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score >= 2) return { label: "Strong", color: "#22C55E", pct: 100 };
    return { label: "Medium", color: "#EAB308", pct: 75 };
  };

  const strength = getStrength(newPassword);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Required Field", "Please enter your current password.");
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert("Required Field", "Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Password Too Short", "New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert("Same Password", "New password must be different from the current one.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));
      setIsLoading(false);

      const successMessage = isForced
        ? "You're all set! Welcome aboard."
        : "Your password has been updated successfully.";

      Alert.alert("Password Changed", successMessage, [
        {
          text: "OK",
          onPress: async () => {
            if (onSuccess) {
              onSuccess();
            }
            if (isForced) {
              await completeFirstLogin();
              // Navigation handled by root layout guard after isFirstLogin=false
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch {
      setIsLoading(false);
      Alert.alert("Error", "Failed to change password. Please try again.");
    }
  };


  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <SafeAreaView style={styles.safeAreaContent} edges={["left", "right"]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            {!isForced ? (
              <BackButton onPress={() => router.back()} />
            ) : (
              <View style={{ width: 0 }} />
            )}
            <Text style={styles.headerTitle}>
              {isForced ? "Set New Password" : "Change Password"}
            </Text>
            {!isForced ? (
              <View style={{ width: 40 }} />
            ) : (
              <View style={{ width: 0 }} />
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Forced-login banner */}
            {isForced && (
              <View style={styles.forcedBanner}>
                <Ionicons name="shield-checkmark" size={20} color="#135BEC" />
                <Text style={styles.forcedBannerText}>
                  Welcome! For your security, please set a new password before continuing.
                </Text>
              </View>
            )}

            {/* Icon Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={48}
                    color="#135BEC"
                  />
                </View>
              </View>
              <Text style={styles.logoText}>
                {isForced ? "Secure Your Account" : "Update Your Password"}
              </Text>
              <Text style={styles.description}>
                {isForced
                  ? "Choose a strong, unique password that you haven't used before."
                  : "Choose a strong password that is at least 6 characters long."}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                show={showCurrent}
                onToggleShow={() => setShowCurrent(!showCurrent)}
                placeholder="Enter current password"
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                show={showNew}
                onToggleShow={() => setShowNew(!showNew)}
                placeholder="Enter new password"
              />

              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        { width: `${strength.pct}%` as any, backgroundColor: strength.color },
                      ]}
                    />
                  </View>
                  {strength.label ? (
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  ) : null}
                </View>
              )}

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                show={showConfirm}
                onToggleShow={() => setShowConfirm(!showConfirm)}
                placeholder="Re-enter new password"
              />

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchRow}>
                  <Ionicons
                    name={
                      newPassword === confirmPassword
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={newPassword === confirmPassword ? "#22C55E" : "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color:
                          newPassword === confirmPassword ? "#22C55E" : "#EF4444",
                      },
                    ]}
                  >
                    {newPassword === confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </Text>
                </View>
              )}
            </View>

            {/* Submit */}
            <View style={styles.actionsSection}>
              <Pressable
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {isForced ? "Set Password & Continue" : "Update Password"}
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
    paddingBottom: 16,
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
  forcedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(19, 91, 236, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(19, 91, 236, 0.2)",
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  forcedBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#135BEC",
    lineHeight: 20,
    fontWeight: "500",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 28,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
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
  inputIconLeft: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  inputIconRight: {
    paddingHorizontal: 12,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -8,
    marginBottom: 16,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 9999,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: 4,
    borderRadius: 9999,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "right",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -8,
    marginBottom: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionsSection: {
    marginTop: 24,
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
  cancelButton: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
});
