import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text as NativeText,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { LexendText as Text } from "../components/LexendText";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    ({ message, type = "info", duration = 3000 }: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast({ message, type, duration });

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 50,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [hideToast, opacity, translateY],
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      default:
        return "information-circle";
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return COLORS.statusCompleted;
      case "error":
        return "#EF4444";
      default:
        return COLORS.primary;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View
            style={[
              styles.toast,
              { borderLeftColor: getColor(toast.type || "info") },
            ]}
          >
            <Ionicons
              name={getIcon(toast.type || "info") as any}
              size={24}
              color={getColor(toast.type || "info")}
              style={styles.toastIcon}
            />
            <Text style={styles.message}>{toast.message}</Text>
            <Pressable onPress={hideToast} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 400,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  message: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    lineHeight: 20,
  },
  toastIcon: {
    marginTop: 1,
  },
  closeButton: {
    marginLeft: 8,
    marginTop: 1,
  },
});
