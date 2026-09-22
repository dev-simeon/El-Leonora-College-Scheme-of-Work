import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../src/constants/colors";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";

type UserRole = "student" | "teacher";

export default function LoginScreen() {
  const router = useRouter();
  const { studentLogin, staffLogin } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form values
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // Validate form
    if (selectedRole === "student") {
      if (!studentId.trim()) {
        showToast({ message: "Please enter your Admission ID", type: "error" });
        return;
      }
    } else {
      if (!email.trim()) {
        showToast({ message: "Please enter your Email", type: "error" });
        return;
      }
      if (!email.includes("@")) {
        showToast({ message: "Please enter a valid email address", type: "error" });
        return;
      }
    }

    if (!password.trim()) {
      showToast({ message: "Please enter your password", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      if (selectedRole === "student") {
        await studentLogin({
          admissionNumber: studentId.trim(),
          password
        });
      } else {
        await staffLogin({
          username: email.trim(),
          password
        });
      }

      router.push("/(main)/home");
      showToast({ message: "Login successful! Welcome back.", type: "success" });
    } catch (error: any) {
      const message =
        error.message ??
        "Login failed. Please check your credentials.";
      showToast({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Login</Text>
              </View>

              {/* Branding Section */}
              <View style={styles.brandingSection}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="school" size={36} color="#135BEC" />
                </View>
                <Text style={styles.mainTitle}>Join El-Leonora College</Text>
                <Text style={styles.subtitle}>Access your scheme of work instantly.</Text>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.form}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Log in as</Text>
                    <View style={styles.roleSwitch}>
                      <Pressable
                        style={styles.roleOption}
                        onPress={() => setSelectedRole("student")}
                      >
                        <View style={[styles.roleOptionInner, selectedRole === "student" && styles.roleOptionActive]}>
                          <Text style={[styles.roleText, selectedRole === "student" && styles.roleTextActive]}>Student</Text>
                        </View>
                      </Pressable>
                      <Pressable
                        style={styles.roleOption}
                        onPress={() => setSelectedRole("teacher")}
                      >
                        <View style={[styles.roleOptionInner, selectedRole === "teacher" && styles.roleOptionActive]}>
                          <Text style={[styles.roleText, selectedRole === "teacher" && styles.roleTextActive]}>Staff</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                  
                  <View style={{ height: 12 }} />

                  <View>
                    {selectedRole === "student" ? (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Admission ID</Text>
                        <View style={styles.inputContainer}>
                          <Ionicons name="card-outline" size={20} color="#9CA3AF" style={styles.inputIconLeft} />
                          <TextInput
                            style={styles.input}
                            placeholder="ELC/ADM/2023/001"
                            placeholderTextColor="#9CA3AF"
                            value={studentId}
                            onChangeText={setStudentId}
                            autoCapitalize="characters"
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                          <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIconLeft} />
                          <TextInput
                            style={styles.input}
                            placeholder="teacher@elleonora.com"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    )}

                    <View style={{ height: 12 }} />

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIconLeft} />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#9CA3AF"
                            style={styles.inputIconRight}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  disabled={isLoading}
                  onPress={handleLogin}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Login</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  brandingSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(19, 91, 236, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  roleSwitch: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  roleOption: {
    flex: 1,
  },
  roleOptionInner: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  roleOptionActive: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  roleTextActive: {
    color: "#135BEC",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIconLeft: {
    marginRight: 12,
  },
  inputIconRight: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#135BEC",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#135BEC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
