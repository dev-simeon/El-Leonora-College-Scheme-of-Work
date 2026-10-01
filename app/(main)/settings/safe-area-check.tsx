import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type BrowserMeasurements = {
  cssTop: string;
  userAgent: string;
  standalone: string;
  uaOsToken: string;
  safariVersion: string;
};

const emptyMeasurements: BrowserMeasurements = {
  cssTop: "Not available",
  userAgent: "Not available",
  standalone: "Not available",
  uaOsToken: "Not exposed",
  safariVersion: "Not exposed",
};

function readBrowserMeasurements(): BrowserMeasurements {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return emptyMeasurements;
  }

  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:1px",
    "height:env(safe-area-inset-top, 0px)",
    "visibility:hidden",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(probe);
  const cssTop = getComputedStyle(probe).height;
  probe.remove();

  const browserNavigator = window.navigator as Navigator & { standalone?: boolean };
  const userAgent = browserNavigator.userAgent;
  const osToken = userAgent.match(/OS (\d+[._]\d+(?:[._]\d+)?)/i);
  const safariToken = userAgent.match(/Version\/([\d.]+)/i);
  const standalone = browserNavigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  return {
    cssTop,
    userAgent,
    standalone: standalone ? "Yes" : "No",
    uaOsToken: osToken ? `${osToken[1].replace(/_/g, ".")} (compatibility token)` : "Not present",
    safariVersion: safariToken?.[1] ?? "Not present",
  };
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{String(value)}</Text>
    </View>
  );
}

export default function SafeAreaCheckScreen() {
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const [browser, setBrowser] = useState(emptyMeasurements);

  const refresh = useCallback(() => setBrowser(readBrowserMeasurements()), []);
  useFocusEffect(useCallback(() => {
    refresh();
    const timer = setTimeout(refresh, 250);
    return () => clearTimeout(timer);
  }, [refresh]));

  useEffect(() => {
    if (Platform.OS !== "web") return;
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
    };
  }, [refresh]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Stack.Screen options={{ title: "Safe Area Diagnostic", headerShown: false }} />
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>iOS PWA Safe Area Check</Text>
        <Text style={styles.description}>
          Open this screen from the installed Home Screen app. These readings come from this app session.
        </Text>

        <Text style={styles.section}>Safe area</Text>
        <View style={styles.card}>
          <Metric label="CSS env(safe-area-inset-top)" value={browser.cssTop} />
          <Metric label="SafeAreaProvider top inset" value={`${insets.top} px`} />
          <Metric label="SafeAreaProvider bottom inset" value={`${insets.bottom} px`} />
        </View>

        <Text style={styles.section}>App and viewport</Text>
        <View style={styles.card}>
          <Metric label="Platform" value={Platform.OS} />
          <Metric label="Standalone display mode" value={browser.standalone} />
          <Metric label="iOS version (browser user agent cannot reliably report this)" value={browser.uaOsToken} />
          <Metric label="Safari Version token" value={browser.safariVersion} />
          <Metric label="Viewport size" value={`${Math.round(dimensions.width)} × ${Math.round(dimensions.height)} CSS px`} />
          {Platform.OS === "web" && typeof window !== "undefined" ? (
            <Metric label="Visual viewport height" value={`${Math.round(window.visualViewport?.height ?? 0)} CSS px`} />
          ) : null}
        </View>

        <Text style={styles.section}>Browser user agent</Text>
        <View style={styles.card}>
          <Text selectable style={styles.userAgent}>{browser.userAgent}</Text>
        </View>

        <Text style={styles.note}>
          iOS version must be checked in Settings → General → About. iOS may send websites a compatibility OS token that differs from the installed version. Please share whether the blur is visible above this screen. If CSS and app top insets both read 0 px while the blur remains, the status-bar area is not being exposed as a safe-area inset to this page.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F7FF" },
  content: { padding: 20, paddingBottom: 48 },
  title: { color: "#152238", fontSize: 24, fontWeight: "700", marginTop: 8 },
  description: { color: "#64748B", fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  section: { color: "#64748B", fontSize: 13, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  metric: { borderBottomColor: "#E8EEF5", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  label: { color: "#64748B", fontSize: 13, marginBottom: 4 },
  value: { color: "#152238", fontSize: 16, fontWeight: "600" },
  userAgent: { color: "#152238", fontSize: 13, lineHeight: 19, paddingVertical: 12 },
  note: { color: "#475569", fontSize: 14, lineHeight: 21, marginTop: 20 },
});
