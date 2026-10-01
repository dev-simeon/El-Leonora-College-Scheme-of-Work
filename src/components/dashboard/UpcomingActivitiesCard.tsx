import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  TermsApi,
  GetTermActivitiesFilterEnum,
} from "../../api/generated/endpoints/terms-api";
import { AcademicSessionsApi } from "../../api/generated/endpoints/academic-sessions-api";
import { Configuration } from "../../api/generated/configuration";
import api, { API_BASE_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  getApiErrorMessage,
  getRequestErrorMessage,
} from "../../utils/apiError";

const termsApi = new TermsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);
const academicSessionsApi = new AcademicSessionsApi(
  new Configuration({ basePath: API_BASE_URL }),
  API_BASE_URL,
  api,
);

const dateParts = (value?: string) => {
  const dateOnly = value?.split("T")[0];
  const date = dateOnly ? new Date(`${dateOnly}T00:00:00`) : new Date();
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }),
  };
};

export function UpcomingActivitiesCard() {
  const { user, token } = useAuth();
  const canLoad = Boolean(token) && Boolean(user);

  const {
    data: termId,
    isLoading: isLoadingTerm,
    isError: isTermError,
    error: termError,
    refetch: refetchTerm,
  } = useQuery({
    queryKey: ["current-academic-session", user?.id],
    queryFn: async () => {
      const response = await academicSessionsApi.getCurrentAcademicSession();
      const body = response.data;
      if (body.success === false) {
        throw new Error(
          getApiErrorMessage(body, "Could not load the current school term."),
        );
      }
      const session = body.data;
      return session?.terms?.find((term) => term.isCurrent)?.id;
    },
    enabled: canLoad,
    retry: false,
  });

  const {
    data: activities = [],
    isLoading,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["term-activities", user?.id, termId, "upcoming", 5],
    queryFn: async () => {
      if (!termId) return [];
      const response = await termsApi.getTermActivities({
        termId,
        filter: GetTermActivitiesFilterEnum.Upcoming,
        pageSize: 5,
      });
      const body = response.data;
      if (body.success === false) {
        throw new Error(
          getApiErrorMessage(body, "Could not load upcoming activities."),
        );
      }
      return body.items ?? [];
    },
    enabled: canLoad && Boolean(termId),
    retry: false,
  });
  const queryError = isTermError ? termError : activitiesError;
  const errorMessage = queryError
    ? getRequestErrorMessage(queryError, "Could not load upcoming activities.")
    : null;

  const retry = () => {
    void refetchTerm();
    if (termId) void refetchActivities();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Activities</Text>
      </View>
      <ScrollView
        style={styles.list}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {errorMessage ? (
          <View style={styles.errorState}>
            <Text style={styles.state}>{errorMessage}</Text>
            <Pressable onPress={retry} accessibilityRole="button">
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : isLoadingTerm || isLoading ? (
          <Text style={styles.state}>Loading upcoming activities…</Text>
        ) : !termId ? (
          <Text style={styles.state}>No current school term found.</Text>
        ) : activities.length === 0 ? (
          <Text style={styles.state}>No upcoming activities.</Text>
        ) : (
          activities.map((activity) => {
            const date = dateParts(activity.eventDate);
            const detail = [activity.eventType, activity.startTime ?? "All Day"]
              .filter(Boolean)
              .join(" • ");
            return (
              <View
                key={activity.id ?? `${activity.title}-${activity.eventDate}`}
                style={styles.row}
              >
                <View style={styles.dateBox}>
                  <Text style={styles.day}>{date.day}</Text>
                  <Text style={styles.month}>{date.month}</Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activity.title ?? "School activity"}
                  </Text>
                  <Text style={styles.activityDetail} numberOfLines={1}>
                    {detail}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: "#191C1D" },
  list: { height: 148 },
  state: {
    paddingVertical: 26,
    textAlign: "center",
    fontSize: 13,
    color: "#68707E",
  },
  errorState: { alignItems: "center" },
  retry: { padding: 8, color: "#0056D2", fontWeight: "700" },
  row: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 10 },
  dateBox: {
    width: 40,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F3F6FC",
    alignItems: "center",
    justifyContent: "center",
  },
  day: { fontSize: 15, lineHeight: 17, fontWeight: "800", color: "#0056D2" },
  month: { fontSize: 10, color: "#424654" },
  copy: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "700", color: "#191C1D" },
  activityDetail: { marginTop: 3, fontSize: 12, color: "#68707E" },
});
