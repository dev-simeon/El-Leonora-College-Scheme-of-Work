import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Application from "expo-application";

import api, {
  API_BASE_URL,
  STORAGE_KEYS,
  clearSecureStoreAuth,
  onSessionExpired,
} from "../services/api";
import { StorageService } from "../services/storage";
import {
  decodeJwt,
  CLAIM_ROLE,
  CLAIM_NAME,
  CLAIM_EMAIL,
  CLAIM_ACTOR,
} from "../utils/jwt";
import { getApiErrorMessage, getRequestErrorMessage } from "../utils/apiError";
import { queryClient } from "../services/queryClient";

import { AuthApi } from "../api/generated/endpoints/auth-api";
import { Configuration } from "../api/generated/configuration";
import {
  LoginRequestDto,
  StudentLoginRequestDto,
} from "../api/generated/models";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "staff" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  backendRole?: string;
  currentSession?: string;
  currentTerm?: string;
  currentTermId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  /** true when the backend flagged `mustChangePassword` — routes user to change-password flow */
  mustChangePassword: boolean;
  studentLogin: (
    credentials: Omit<StudentLoginRequestDto, "device">,
  ) => Promise<void>;
  staffLogin: (credentials: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  completeMustChangePassword: () => Promise<void>;
}

// ─── API client ──────────────────────────────────────────────────────────────

const authApi = new AuthApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Device helpers ──────────────────────────────────────────────────────────

const getDeviceDetails = async () => {
  let deviceId: string | null = "N/A";
  if (Platform.OS === "android") {
    deviceId = Application.getAndroidId();
  } else if (Platform.OS === "ios") {
    deviceId = await Application.getIosIdForVendorAsync();
  }

  return {
    deviceId: deviceId ?? "N/A",
    deviceName: Device.deviceName ?? "Unknown",
    deviceBrand: Device.brand ?? "Unknown",
    deviceModel: Device.modelName ?? "Unknown",
    deviceManufacturer: Device.manufacturer ?? "Unknown",
    deviceYear: Device.deviceYearClass ?? new Date().getFullYear(),
  };
};

// ─── JWT claim helpers ────────────────────────────────────────────────────────

/**
 * Normalise the `mustChangePassword` claim which the backend sends as the
 * literal string "True" / "False" (PascalCase).
 */
const parseMustChangePassword = (value: unknown): boolean =>
  String(value ?? "false").toLowerCase() === "true";

/**
 * Extract the actor from the JWT and map to 'staff' or 'student'.
 * The backend sends "Staff" or "Student" in the CLAIM_ACTOR.
 * We treat anything not "student" as "staff".
 */
const parseActorToRole = (payload: any): UserRole => {
  const actor = String(payload[CLAIM_ACTOR] ?? "").toLowerCase();
  return actor === "student" ? "student" : "staff";
};

/** Build a `User` object from a decoded JWT payload. */
const buildUserFromPayload = (payload: ReturnType<typeof decodeJwt>): User => {
  if (!payload) throw new Error("Cannot build user: JWT payload is null");

  const actorValue = String(payload[CLAIM_ACTOR] ?? "");
  const roleValue = String(payload[CLAIM_ROLE] ?? "");

  // The C# backend may emit the name under the full SOAP URI or a shorthand claim.
  // Try each key in priority order until we find a non-empty value.
  const nameValue =
    String(payload[CLAIM_NAME] ?? "") ||
    String((payload as any)["unique_name"] ?? "") ||
    String((payload as any)["name"] ?? "") ||
    String((payload as any)["given_name"] ?? "") ||
    "";

  return {
    id: payload.sub,
    name: nameValue,
    email: String(payload[CLAIM_EMAIL] ?? ""),
    role: parseActorToRole(payload),
    backendRole: roleValue || (actorValue === "student" ? "Student" : "Staff"),
    currentSession: "2025/26 Session",
    currentTerm: "2nd Term",
    currentTermId: "2",
  };
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // ── Session restoration on app start ────────────────────────────────────
  useEffect(() => {
    loadStorageData();
  }, []);

  // ── Listen for session-expired events from the API interceptor ───────────
  // When the token refresh fails (e.g. refresh token expired / 400 from server),
  // api.ts emits a "sessionExpired" event. We react by clearing local state,
  // which causes Expo Router's auth guard to redirect to the login screen.
  useEffect(() => {
    const unsubscribe = onSessionExpired(async () => {
      queryClient.clear();
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await StorageService.getItem(
        STORAGE_KEYS.ACCESS_TOKEN,
      );

      if (!storedToken) return;

      const payload = decodeJwt(storedToken);
      if (!payload) {
        // Token is malformed — clear everything
        await clearSecureStoreAuth();
        return;
      }

      const userData = buildUserFromPayload(payload);
      const mcp = parseMustChangePassword(payload.mustChangePassword);

      setToken(storedToken);
      setUser(userData);
      setMustChangePassword(mcp);
    } catch {
      await clearSecureStoreAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared token persistence + state update ──────────────────────────────
  const applySession = useCallback(
    async (accessToken: string, refreshToken: string) => {
      const payload = decodeJwt(accessToken);
      if (!payload)
        throw new Error("Received an invalid access token from the server");

      const userData = buildUserFromPayload(payload);
      const mcp = parseMustChangePassword(payload.mustChangePassword);

      const effectiveMcp = mcp;

      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);

      setToken(accessToken);
      setUser(userData);
      setMustChangePassword(effectiveMcp);
    },
    [],
  );

  // ── Student login ────────────────────────────────────────────────────────
  const studentLogin = async (
    credentials: Omit<StudentLoginRequestDto, "device">,
  ) => {
    try {
      const device = await getDeviceDetails();

      const response = await authApi.studentLogin({
        studentLoginRequestDto: { ...credentials, device },
      });

      const body = response.data;

      if (body.success === false || !body.data) {
        throw new Error(getApiErrorMessage(body, "Student login failed"));
      }

      const { accessToken, refreshToken } = body.data;
      if (!accessToken || !refreshToken) {
        throw new Error("Server returned an incomplete token response");
      }

      await applySession(accessToken, refreshToken);
    } catch (error: any) {
      const wrappedError = new Error(
        getRequestErrorMessage(
          error,
          "An unexpected error occurred during login",
        ),
      ) as Error & { cause?: unknown };
      wrappedError.cause = error;
      throw wrappedError;
    }
  };

  // ── Staff login ──────────────────────────────────────────────────────────
  const staffLogin = async (credentials: LoginRequestDto) => {
    try {
      const response = await authApi.staffLogin({
        loginRequestDto: credentials,
      });

      const body = response.data;

      if (body.success === false || !body.data) {
        throw new Error(getApiErrorMessage(body, "Staff login failed"));
      }

      const { accessToken, refreshToken } = body.data;
      if (!accessToken || !refreshToken) {
        throw new Error("Server returned an incomplete token response");
      }

      await applySession(accessToken, refreshToken);
    } catch (error: any) {
      const wrappedError = new Error(
        getRequestErrorMessage(
          error,
          "An unexpected error occurred during login",
        ),
      ) as Error & { cause?: unknown };
      wrappedError.cause = error;
      throw wrappedError;
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout must complete even if the server is unavailable.
    } finally {
      // Always clear local state regardless of API success
      await clearSecureStoreAuth();
      queryClient.clear();
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
    }
  };

  // ── Mark forced password change as done ──────────────────────────────────
  const completeMustChangePassword = async () => {
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        mustChangePassword,
        studentLogin,
        staffLogin,
        logout,
        completeMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
