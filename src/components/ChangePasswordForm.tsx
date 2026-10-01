import { useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { BackButton } from "./BackButton";
import { AccountApi } from "../api/generated/endpoints/account-api";
import { Configuration } from "../api/generated/configuration";
import { useToast } from "../context/ToastContext";
import api, { API_BASE_URL } from "../services/api";
import { getApiErrorMessage, getRequestErrorMessage } from "../utils/apiError";

// ─── API Client ───────────────────────────────────────────────────────────────
const accountApi = new AccountApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChangePasswordFormProps {
  /** When true: forced change — no back button, must complete before proceeding */
  isForced: boolean;
  /** Called after a successful password change (before navigation) */
  onSuccess?: () => void;
}

// ─── Password Input ───────────────────────────────────────────────────────────
function PasswordField({
  label,
  value,
  onChangeText,
  show,
  onToggleShow,
  placeholder,
  isFocused,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  isFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <View style={styles.inputIconLeft}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
        </View>
        <TextInput
          style={[
            styles.input,
            Platform.OS === "web" && ({ outline: "none" } as any),
          ]}
          placeholder={placeholder ?? "••••••••"}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#135BEC"
        />
        <Pressable
          style={styles.inputIconRight}
          onPress={onToggleShow}
          hitSlop={8}
        >
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

// ─── Strength helper ──────────────────────────────────────────────────────────
const getStrength = (
  p: string,
): { label: string; color: string; pct: number } => {
  if (!p) return { label: "", color: "#E5E7EB", pct: 0 };
  if (p.length < 8) return { label: "Too short", color: "#EF4444", pct: 25 };
  if (p.length < 8) return { label: "Weak", color: "#F97316", pct: 50 };
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) =>
    r.test(p),
  ).length;
  if (score >= 2) return { label: "Strong", color: "#22C55E", pct: 100 };
  return { label: "Medium", color: "#EAB308", pct: 75 };
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChangePasswordForm({
  isForced,
  onSuccess,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeMustChangePassword, logout } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "current" | "new" | "confirm" | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = getStrength(newPassword);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!currentPassword.trim()) return "Please enter your current password.";
    if (!newPassword.trim()) return "Please enter a new password.";
    if (newPassword.length < 8)
      return "New password must be at least 8 characters.";
    if (newPassword !== confirmPassword)
      return "New password and confirmation do not match.";
    if (currentPassword === newPassword)
      return "New password must be different from the current one.";
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setErrorMsg(null);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await accountApi.changePassword({
        changePasswordDto: {
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword,
        },
      });

      const body = response.data;

      // The server wraps the result in ApiResponse — treat success:false as an error
      if (body.success === false) {
        throw new Error(
          getApiErrorMessage(body, "Password change failed. Please try again."),
        );
      }

      // ── Success ─────────────────────────────────────────────────────────────
      const successMessage = isForced
        ? "You're all set! Welcome aboard."
        : "Your password has been updated successfully.";

      showToast({ message: successMessage, type: "success" });

      onSuccess?.();
      if (isForced) {
        await completeMustChangePassword();
      } else {
        router.back();
      }
    } catch (error: any) {
      setErrorMsg(
        getRequestErrorMessage(
          error,
          "Failed to change password. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeAreaContent} edges={["left", "right"]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
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
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === "android"}
          >
            {/* Forced-change banner */}
            {isForced && (
              <View style={styles.forcedBanner}>
                <Ionicons name="shield-checkmark" size={20} color="#135BEC" />
                <Text style={styles.forcedBannerText}>
                  Welcome! For your security, please set a new password before
                  continuing.
                </Text>
              </View>
            )}

            {/* Icon */}
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

            {/* Error banner */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#DC2626"
                />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChangeText={(v) => {
                  setCurrentPassword(v);
                  setErrorMsg(null);
                }}
                show={showCurrent}
                onToggleShow={() => setShowCurrent(!showCurrent)}
                placeholder="Enter current password"
                isFocused={focusedField === "current"}
                onFocus={() => setFocusedField("current")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "current" ? null : current,
                  )
                }
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  setErrorMsg(null);
                }}
                show={showNew}
                onToggleShow={() => setShowNew(!showNew)}
                placeholder="Enter new password"
                isFocused={focusedField === "new"}
                onFocus={() => setFocusedField("new")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "new" ? null : current,
                  )
                }
              />

              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: `${strength.pct}%` as any,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  {strength.label ? (
                    <Text
                      style={[styles.strengthLabel, { color: strength.color }]}
                    >
                      {strength.label}
                    </Text>
                  ) : null}
                </View>
              )}

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  setErrorMsg(null);
                }}
                show={showConfirm}
                onToggleShow={() => setShowConfirm(!showConfirm)}
                placeholder="Re-enter new password"
                isFocused={focusedField === "confirm"}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "confirm" ? null : current,
                  )
                }
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
                    color={
                      newPassword === confirmPassword ? "#22C55E" : "#EF4444"
                    }
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color:
                          newPassword === confirmPassword
                            ? "#22C55E"
                            : "#EF4444",
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
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitButtonText}>
                      {isForced ? "Set Password & Continue" : "Update Password"}
                    </Text>
                  </>
                )}
              </Pressable>

              {isForced && (
                <Pressable
                  style={styles.logoutButton}
                  onPress={async () => {
                    try {
                      setIsLoading(true);
                      await logout();
                    } catch (err: any) {
                      Alert.alert(
                        "Logout Failed",
                        getRequestErrorMessage(
                          err,
                          "Could not clear session. Check network or server status.",
                        ),
                        [{ text: "OK" }],
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#EF4444"
                      />
                      <Text style={styles.logoutText}>
                        Log Out & Clear Session
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#F6F6F8" },
  safeAreaContent: { flex: 1, backgroundColor: "#F6F6F8" },
  container: { flex: 1, backgroundColor: "#F6F6F8" },
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
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
  logoSection: { alignItems: "center", paddingTop: 16, paddingBottom: 20 },
  logoContainer: { marginBottom: 16 },
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
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: "#DC2626" },
  form: { gap: 4 },
  formGroup: { marginBottom: 16 },
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
  inputContainerFocused: {
    borderColor: "#135BEC",
    backgroundColor: "#FFFFFF",
    shadowColor: "#135BEC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconLeft: { paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: "#111827", paddingVertical: 0 },
  inputIconRight: {
    paddingHorizontal: 12,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
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
  strengthBarFill: { height: 4, borderRadius: 9999 },
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
  matchText: { fontSize: 12, fontWeight: "500" },
  actionsSection: { marginTop: 24, gap: 12 },
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
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
});
