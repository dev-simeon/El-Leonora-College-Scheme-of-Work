import axios, { InternalAxiosRequestConfig } from "axios";
import globalAxios from "axios";
import type { LoginResponseDtoApiResponse } from "../api/generated/models";
import { StorageService } from "./storage";
import { getApiErrorMessage, getRequestErrorDetails } from "../utils/apiError";

// ─── Session-expired event bus ───────────────────────────────────────────────
// api.ts has no access to React state, so we use a plain pub/sub to notify
// AuthContext when a token refresh fails and the user must be logged out.
type SessionExpiredListener = () => void;
const sessionExpiredListeners: Set<SessionExpiredListener> = new Set();

export const onSessionExpired = (listener: SessionExpiredListener) => {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener); // returns unsubscribe fn
};

const emitSessionExpired = () => {
  sessionExpiredListeners.forEach((fn) => fn());
};

// Expo injects EXPO_PUBLIC_* vars at build time via the global object
declare const process: { env: Record<string, string | undefined> };

const STORAGE_KEYS = {
  ACCESS_TOKEN: "userToken",
  REFRESH_TOKEN: "userRefreshToken",
  // Legacy keys for cleanup
  USER_DATA: "userData",
  IS_FIRST_LOGIN: "isFirstLogin",
} as const;

/**
 * Atomic wipe of all auth-related keys in SecureStore.
 * Used by logout, refresh-failure, and session-restore errors.
 */
export const clearSecureStoreAuth = async () => {
  await Promise.allSettled([
    StorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    StorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    StorageService.removeItem(STORAGE_KEYS.USER_DATA),
    StorageService.removeItem(STORAGE_KEYS.IS_FIRST_LOGIN),
  ]);
};

export const API_BASE_URL =
  process?.env?.EXPO_PUBLIC_API_URL ?? "https://api.elleonoraschools.sch.ng";

// ─── Main API instance (intercepted) ────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Attach the access token as a Bearer header on every outgoing request.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await StorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      console.log(
        ">>> [AXIOS REQUEST]",
        config.method?.toUpperCase(),
        config.url,
      );
      console.log("    Token exists in storage:", !!token);

      if (token) {
        // Axios 1.x headers are a specialized object, but we can still set them like this
        config.headers.Authorization = `Bearer ${token}`;

        // Also try setting it directly on the internal headers object if it exists
        if ((config as any)._headers) {
          (config as any)._headers["Authorization"] = `Bearer ${token}`;
        }

        console.log("    Authorization header attached.");
      } else {
        console.warn(
          "    WARNING: No token found in SecureStore for this request!",
        );
      }
    } catch (error) {
      console.error("[api] Request interceptor CRITICAL FAILURE:", error);
    }
    return config;
  },
  (error) => {
    console.error("[api] Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// On 401: attempt a single token refresh then replay the failed request.
// Queues concurrent requests during an in-flight refresh.
// If the refresh fails, clears stored auth and rejects all queued requests.

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    console.error("error:", getRequestErrorDetails(error, "Request failed"));

    // Only intercept 401 Unauthorized; skip refresh calls themselves to avoid loops
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is already in-flight — queue this request until it resolves
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = await StorageService.getItem(
        STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("[api] Triggering token refresh...");

      // Use a bare globalAxios instance (not the intercepted `api`) to avoid
      // triggering this same interceptor infinitely on a 401 refresh failure.
      // The generated AuthApi sends refreshToken as a query parameter.
      const { data } = await globalAxios.post<LoginResponseDtoApiResponse>(
        `${API_BASE_URL}/api/v1/auth/refresh-token`,
        null, // no body
        {
          params: { refreshToken: storedRefreshToken },
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        },
      );

      if (!data.success || !data.data) {
        throw new Error(getApiErrorMessage(data, "Token refresh failed"));
      }

      const { accessToken, refreshToken: newRefreshToken } = data.data;

      if (!accessToken || !newRefreshToken) {
        throw new Error("Malformed refresh response from server");
      }

      console.log("[api] Token refreshed successfully.");

      // Persist updated tokens
      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        StorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
      ]);

      // Unblock all queued requests with the new access token
      processQueue(null, accessToken);

      // Replay the original failed request with the new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      console.error("[api] Token refresh failed:", refreshError);
      processQueue(refreshError, null);

      // Clear all stored auth state and notify AuthContext to redirect to login
      await clearSecureStoreAuth();
      emitSessionExpired();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { STORAGE_KEYS };
export default api;
