import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { WeekData, Topic, SubjectTopics } from "../../../src/data/topicsData";
import { LessonsApi } from "../../../src/api/generated/endpoints/lessons-api";
import { Configuration } from "../../../src/api/generated/configuration";
import api, { API_BASE_URL, STORAGE_KEYS } from "../../../src/services/api";
import { StorageService } from "../../../src/services/storage";
import { useToast } from "../../../src/context/ToastContext";
import {
  getApiErrorMessage,
  getRequestErrorMessage,
} from "../../../src/utils/apiError";

// ─── API Client ──────────────────────────────────────────────────────────────
const lessonsApi = new LessonsApi(
  new Configuration({
    basePath: API_BASE_URL,
    accessToken: async () =>
      (await StorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN)) || "",
  }),
  API_BASE_URL,
  api,
);

export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const {
    id: subjectId,
    classId,
    name: subjectName,
    classCode,
  } = useLocalSearchParams<{
    id: string;
    classId: string;
    name: string;
    classCode: string;
  }>();

  // Lesson topics use the fixed term IDs expected by the lessons API, rather
  // than a current academic-session term supplied by another screen.
  const [selectedTerm, setSelectedTerm] = useState("1st Term");
  const [selectedTermId, setSelectedTermId] = useState("1");
  const [isTermMenuVisible, setIsTermMenuVisible] = useState(false);
  const { showToast } = useToast();

  const termIdMapNumeric: Record<string, number> = {
    "1st Term": 1,
    "2nd Term": 2,
    "3rd Term": 3,
  };
  const currentTermId =
    parseInt(selectedTermId) || termIdMapNumeric[selectedTerm] || 1;

  const {
    data: lessons = [],
    isPending: isLoading,
    isError,
    error: queryError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["topics", subjectId, classId, currentTermId],
    queryFn: async () => {
      console.log("[Topics] Fetching with:", {
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        termId: currentTermId,
      });

      const response = await lessonsApi.getLessonTopics({
        subjectId,
        classId,
        termId: currentTermId,
      });

      console.log(
        "[Topics] API Response:",
        JSON.stringify(response.data, null, 2),
      );

      const body = response.data;

      // Handle both success:false and undefined (some backends omit the field)
      if (body.success === false) {
        throw new Error(getApiErrorMessage(body, "Failed to load topics."));
      }

      return body.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const error = isError
    ? getRequestErrorMessage(
        queryError,
        "An error occurred while fetching topics.",
      )
    : null;

  // Grouping lessons into the SubjectTopics structure
  const subjectTopics = useMemo(() => {
    if (lessons.length === 0) return null;

    // Mapping different possible backend field names defensively
    const weeksMap: Record<number, any[]> = {};
    lessons.forEach((lesson: any, sourceIndex: number) => {
      const weekNum = lesson.weekNumber ?? lesson.week ?? 1;
      if (!weeksMap[weekNum]) weeksMap[weekNum] = [];
      weeksMap[weekNum].push({
        id: lesson.id?.toString() || Math.random().toString(),
        title: lesson.topic || lesson.title || lesson.name || "Untitled Topic",
        strand: lesson.strand || lesson.category || null,
        completed: lesson.isCompleted ?? false,
        // Preserve API order when an older response does not include orderIndex.
        orderIndex: Number.isFinite(Number(lesson.orderIndex))
          ? Number(lesson.orderIndex)
          : sourceIndex,
      });
    });

    const weeks: WeekData[] = Object.keys(weeksMap)
      .map((week) => ({
        weekNumber: parseInt(week),
        topics: weeksMap[parseInt(week)]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(({ orderIndex, ...topic }) => topic),
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber);

    return {
      subjectId,
      subjectName: subjectName || "Subject Details",
      term: selectedTerm,
      completionPercent: 0, // Could be calculated
      weeks,
    } as SubjectTopics;
  }, [lessons, subjectId, subjectName, selectedTerm]);

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
      console.warn("[Topics] API Error Message:", error);
    }
  }, [error, showToast]);

  const onRefresh = () => {
    refetch();
  };

  const handleTermSelect = (term: string) => {
    const termIdMap: Record<string, string> = {
      "1st Term": "1",
      "2nd Term": "2",
      "3rd Term": "3",
    };
    setSelectedTerm(term);
    setSelectedTermId(termIdMap[term]);
    setIsTermMenuVisible(false);
  };

  const handleTopicPress = (topic: Topic) => {
    router.push({
      pathname: "/(main)/home/topic-content",
      params: {
        topicId: topic.id,
        topicTitle: topic.title,
        subjectId: subjectId,
        classId: classId,
        termId: selectedTermId,
      },
    });
  };

  if (isLoading && lessons.length === 0) {
    return (
      <View style={styles.container}>
        {isFocused && <StatusBar style="dark" />}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.headerTitle}>{subjectName || "Loading..."}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching topics...</Text>
        </View>
      </View>
    );
  }

  const renderTopic = (topic: Topic) => (
    <Pressable
      key={topic.id}
      style={styles.topicCard}
      onPress={() => handleTopicPress(topic)}
    >
      <View style={styles.topicInfo}>
        <Text style={styles.topicTitle} numberOfLines={3}>
          {topic.title}
        </Text>
        {!!topic.strand && (
          <View style={styles.strandTag}>
            <Text style={styles.strandTagText} numberOfLines={1}>
              {topic.strand}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.statusContainer}>
        <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
      </View>
    </Pressable>
  );

  const renderWeek = ({ item }: { item: WeekData }) => (
    <View style={styles.weekSection}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>Week {item.weekNumber}</Text>
        <Text style={styles.topicCount}>
          {item.topics.length} {item.topics.length === 1 ? "topic" : "topics"}
        </Text>
      </View>
      <View style={styles.topicsList}>{item.topics.map(renderTopic)}</View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) return null; // Already handled by initial loading or we want a different overlay

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No topics found for this subject.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="dark" />}

      {/* Header with Top Inset */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {subjectTopics?.subjectName || subjectName}
          </Text>
          <Text style={styles.headerSubtitle}>{classCode}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={subjectTopics?.weeks || []}
        renderItem={renderWeek}
        keyExtractor={(item) => `week-${item.weekNumber}`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={
          <View style={styles.filterSection}>
            <View style={styles.termFilterWrapper}>
              <Pressable
                style={[
                  styles.termFilter,
                  isTermMenuVisible && styles.termFilterActive,
                ]}
                onPress={() => setIsTermMenuVisible(!isTermMenuVisible)}
              >
                <Text style={styles.termFilterText}>{selectedTerm}</Text>
                <Ionicons
                  name={isTermMenuVisible ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#FFFFFF"
                />
              </Pressable>

              {isTermMenuVisible && (
                <View style={styles.termDropdown}>
                  <Pressable
                    style={styles.termOption}
                    onPress={() => handleTermSelect("1st Term")}
                  >
                    <Text
                      style={[
                        styles.termOptionText,
                        selectedTerm === "1st Term" &&
                          styles.termOptionTextActive,
                      ]}
                    >
                      1st Term
                    </Text>
                    {selectedTerm === "1st Term" && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.termOption}
                    onPress={() => handleTermSelect("2nd Term")}
                  >
                    <Text
                      style={[
                        styles.termOptionText,
                        selectedTerm === "2nd Term" &&
                          styles.termOptionTextActive,
                      ]}
                    >
                      2nd Term
                    </Text>
                    {selectedTerm === "2nd Term" && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.termOption}
                    onPress={() => handleTermSelect("3rd Term")}
                  >
                    <Text
                      style={[
                        styles.termOptionText,
                        selectedTerm === "3rd Term" &&
                          styles.termOptionTextActive,
                      ]}
                    >
                      3rd Term
                    </Text>
                    {selectedTerm === "3rd Term" && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        }
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 32 },
          (!subjectTopics || subjectTopics.weeks.length === 0) && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
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
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  listHeader: {
    zIndex: 100,
    elevation: 5,
  },
  filterSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
    zIndex: 1000,
  },
  termFilterWrapper: {
    zIndex: 2000,
    elevation: 10,
    position: "relative",
  },
  termFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignSelf: "flex-start",
    gap: 8,
  },
  termFilterActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  termFilterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  termDropdown: {
    position: "absolute",
    top: 44,
    left: 0,
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20, // Higher elevation for Android
    zIndex: 9999, // Absolute top
    overflow: "hidden",
  },
  termOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  termOptionText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  termOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  weekSection: {
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  topicCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  topicsList: {
    gap: 12,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 21,
  },
  strandTag: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  strandTagText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  errorIconWrap: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
