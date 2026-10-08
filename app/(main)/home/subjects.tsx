import React, { useEffect, useCallback } from "react";
import {
  View,
  Text as NativeText,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { LexendText as Text } from "../../../src/components/LexendText";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../src/constants/colors";
import { DashboardHeader } from "../../../src/components/DashboardHeader";
import { SubjectCard } from "../../../src/components/SubjectCard";
import { Subject } from "../../../src/data/subjectData";
import { useRouter } from "expo-router";
import { AccountApi } from "../../../src/api/generated/endpoints/account-api";
import { Configuration } from "../../../src/api/generated/configuration";
import api, { API_BASE_URL, STORAGE_KEYS } from "../../../src/services/api";
import { StorageService } from "../../../src/services/storage";
import { useToast } from "../../../src/context/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { StudentsApi } from "../../../src/api/generated/endpoints/students-api";
import {
  getApiErrorMessage,
  getRequestErrorMessage,
} from "../../../src/utils/apiError";

// ─── API Client ──────────────────────────────────────────────────────────────
const accountApi = new AccountApi(
  new Configuration({
    basePath: API_BASE_URL,
    accessToken: async () =>
      (await StorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN)) || "",
  }),
  API_BASE_URL,
  api,
);

const MOCKUP_COLORS = [
  { bg: "#FFEDD5", color: "#F97316" }, // 1. Orange
  { bg: "#DBEAFE", color: "#3B82F6" }, // 2. Blue
  { bg: "#DCFCE7", color: "#059669" }, // 3. Emerald
  { bg: "#E0E7FF", color: "#6366F1" }, // 4. Indigo
  { bg: "#F3E8FF", color: "#A855F7" }, // 5. Purple
  { bg: "#FEE2E2", color: "#F43F5E" }, // 6. Rose
];

export default function SchemesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    data,
    isPending: isLoading,
    isError,
    error: queryError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["subjects", user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      // Students and Staff both use this endpoint to see their assigned/relevant subjects
      console.log("[subjects] Fetching my-subjects:", {
        userId: user?.id,
        role: user?.role,
        pageNumber: pageParam,
      });

      const response = await accountApi.mySubjects({
        pageNumber: pageParam,
        pageSize: 20,
      });
      const body = response.data;

      console.log("[subjects] my-subjects response:", {
        success: body.success,
        itemCount: body.items?.length ?? 0,
        pagination: body.pagination,
      });

      if (!body.success || !body.items) {
        throw new Error(getApiErrorMessage(body, "Failed to fetch subjects"));
      }

      const items = body.items.map((dto) => {
        const subjectId = dto.id?.toString() || "0";
        const classId = dto.class?.id?.toString() || "0";
        const classCode = dto.class?.code || "Unknown";

        return {
          id: subjectId,
          classId: classId,
          name: dto.name || "Unknown Subject",
          code: dto.code || "",
          image:
            "https://api.builder.io/api/v1/image/assets/TEMP/e6e93590cf39294da610ea1807eece6643579f35",
          weekProgress: classCode,
          classCode: classCode,
          progressPercent: 0, // Could be derived if needed
          progressColor: COLORS.primary,
        };
      });

      return {
        items,
        pagination: body.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (
        lastPage.pagination?.pageNumber &&
        lastPage.pagination?.totalPages &&
        lastPage.pagination.pageNumber < lastPage.pagination.totalPages
      ) {
        return lastPage.pagination.pageNumber + 1;
      }
      return undefined;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    // Only query when we have a valid authenticated user ID to ensures cache hits
    enabled: !!user?.id,
  });

  const subjects = data?.pages.flatMap((page) => page.items) || [];

  const error = isError
    ? getRequestErrorMessage(queryError, "Failed to fetch subjects")
    : null;

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  useEffect(() => {
    if (isFocused && user?.id) {
      refetch();
    }
  }, [isFocused, refetch, user?.id]);

  const onRefresh = () => {
    refetch();
  };

  const handleSubjectPress = (
    id: string,
    classId: string,
    name: string,
    classCode: string,
  ) => {
    router.push({
      pathname: "/(main)/home/topics",
      params: {
        id,
        classId,
        name,
        classCode: classCode,
      },
    });
  };

  const renderSubjectItem = ({
    item,
    index,
  }: {
    item: Subject;
    index: number;
  }) => {
    const isEven = index % 2 === 0;
    const colorConfig = MOCKUP_COLORS[index % MOCKUP_COLORS.length];

    return (
      <View
        style={[
          styles.subjectItem,
          isEven ? styles.subjectItemLeft : styles.subjectItemRight,
        ]}
      >
        <SubjectCard
          name={item.name}
          weekProgress={item.weekProgress}
          cardColor={colorConfig.bg}
          spineColor={colorConfig.color}
          iconColor={colorConfig.color}
          onPress={() =>
            handleSubjectPress(item.id, item.classId, item.name, item.classCode)
          }
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="dark" />}
      <DashboardHeader />

      <View style={styles.mainContent}>
        {isLoading && subjects.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Loading your subjects...</Text>
          </View>
        ) : error && subjects.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={64} color="#94A3B8" />
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={subjects}
            renderItem={renderSubjectItem}
            keyExtractor={(item) => `${item.id}-${item.classId}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            contentContainerStyle={[
              styles.gridContent,
              {
                paddingBottom: insets.bottom + 40,
                paddingHorizontal: 16,
              },
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <Text style={styles.headerTitle}>My Subjects</Text>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loaderFooter}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading && !isRefetching ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No subjects assigned to you yet.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridContent: {
    paddingBottom: 40, // Reduced default but will handle dynamic insets if needed
  },
  subjectItem: {
    width: "48%",
  },
  subjectItemLeft: {
    marginRight: 4,
  },
  subjectItemRight: {
    marginLeft: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loaderText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
  },
});
