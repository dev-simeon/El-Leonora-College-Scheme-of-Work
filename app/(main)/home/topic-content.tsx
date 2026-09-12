import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { LessonsApi } from "../../../src/api/generated/endpoints/lessons-api";
import { Configuration } from "../../../src/api/generated/configuration";
import api, { API_BASE_URL, STORAGE_KEYS } from "../../../src/services/api";
import * as SecureStore from 'expo-secure-store';
import { useToast } from "../../../src/context/ToastContext";
import { LessonDetailDto } from "../../../src/api/generated/models/lesson-detail-dto";
import { LessonBlockDto, LessonBlockDtoBlockTypeEnum } from "../../../src/api/generated/models/lesson-block-dto";
import { getApiErrorMessage, getRequestErrorMessage } from "../../../src/utils/apiError";

// ─── API Client ──────────────────────────────────────────────────────────────
const lessonsApi = new LessonsApi(
  new Configuration({ 
    basePath: API_BASE_URL,
    accessToken: async () => (await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN)) || ""
  }),
  API_BASE_URL,
  api
);

export default function TopicContentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topicId, topicTitle } = useLocalSearchParams<{ 
    topicId: string; 
    topicTitle: string;
  }>();

  const { showToast } = useToast();

  const { data: lessonDetail = null, isPending: isLoading, isError, error: queryError, refetch, isRefetching } = useQuery({
    queryKey: ["topicContent", topicId],
    queryFn: async () => {
      if (!topicId) throw new Error("Missing topic ID");
      
      const response = await lessonsApi.getLesson({ lessonUnitId: topicId });
      
      console.log("[TopicContent] API Response:", JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        throw new Error(getApiErrorMessage(response.data, "Failed to load lesson content."));
      }

      return response.data.data || null;
    },
    enabled: !!topicId,
  });

  const error = isError ? getRequestErrorMessage(queryError, "An error occurred.") : null;

  useEffect(() => {
    if (error) {
       showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  const onRefresh = () => {
    refetch();
  };

  const renderBlock = (block: LessonBlockDto, index: number) => {
    const payload = block.payload;
    if (!payload) return null;

    switch (block.blockType) {
      case LessonBlockDtoBlockTypeEnum.Heading:
        // Use H1 style for the very first heading if it matches the main topic, 
        // otherwise regular section heading
        const isMainHeading = index === 0;
        return (
          <View key={block.id || index} style={styles.headingBlock}>
            {!isMainHeading && <View style={styles.sectionAccent} />}
            <Text style={isMainHeading ? styles.heroTitle : styles.sectionTitle}>
              {payload.content}
            </Text>
          </View>
        );

      case LessonBlockDtoBlockTypeEnum.Paragraph:
        // Detect if this is the "Objectives" intro text (usually follows the main heading)
        const isObjectivesIntro = index === 1 && payload.content?.toLowerCase().includes("by the end of this lesson");
        
        return (
          <View key={block.id || index} style={isObjectivesIntro ? styles.objectivesIntroContainer : styles.paragraphBlock}>
             <Text style={isObjectivesIntro ? styles.objectivesIntroText : styles.bodyText}>
               {payload.content}
             </Text>
          </View>
        );

      case LessonBlockDtoBlockTypeEnum.List:
        // Detect if this is the objective list (usually index 2 or following objectives intro)
        const isObjectivesList = index <= 3 && payload.items?.some((it: string) => it.toLowerCase().includes("students should be able to") || index === 2);

        return (
          <View key={block.id || index} style={isObjectivesList ? styles.objectivesCard : styles.listBlock}>
            {isObjectivesList && (
               <View style={styles.objectivesHeader}>
                 <MaterialCommunityIcons name="target" size={20} color={COLORS.primary} />
                 <Text style={styles.objectivesTitle}>Learning Objectives</Text>
               </View>
            )}
            
            {payload.items?.map((item: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.listDotContainer}>
                  {payload.ordered ? (
                    <Text style={styles.listOrderNumber}>{i + 1}.</Text>
                  ) : (
                    <Ionicons name="ellipse" size={8} color={COLORS.primary} style={{ marginTop: 7 }} />
                  )}
                </View>
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lessonDetail?.topic || topicTitle || "Lesson"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Oops!</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : !lessonDetail?.blocks || lessonDetail.blocks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Content Yet</Text>
            <Text style={styles.emptyText}>
              Learning materials for this topic are currently being prepared.
            </Text>
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            {/* Meta Info Placeholder (Grade/Subj/Time) - Hidden for now as per user request */}
            {/* 
            <View style={styles.metaChips}>
              <View style={styles.chip}>
                <Ionicons name="school" size={14} color={COLORS.primary} />
                <Text style={styles.chipText}>Academic</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="time" size={14} color="#F59E0B" />
                <Text style={styles.chipText}>45 mins</Text>
              </View>
            </View>
            */}

            {/* Dynamic Blocks Rendering */}
            {lessonDetail.blocks
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
              .map((block, index) => renderBlock(block, index))}

            {/* Resources Section (Static Placeholder) - Hidden for now as per user request */}
            {/* 
            <View style={styles.sectionArea}>
              <View style={styles.resourcesHeader}>
                <Text style={styles.sectionTitleMain}>Topic Resources</Text>
                <View style={styles.resourceCount}>
                  <Text style={styles.resourceCountText}>3 Files</Text>
                </View>
              </View>
              
              <View style={styles.resourceCard}>
                <View style={styles.resourceIconContainer}>
                  <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>Lesson Summary.pdf</Text>
                  <Text style={styles.resourceDetail}>PDF • 1.2 MB</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#94A3B8" />
              </View>
            </View>
            */}

            {/* Footnote */}
            <View style={styles.footnote}>
              <Text style={styles.footnoteText}>
                Source: El-Leonora College Curriculum v1.0
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginHorizontal: 8,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  contentWrapper: {
    gap: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metaChips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  headingBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 4,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  paragraphBlock: {
    marginVertical: 4,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#334155",
    fontWeight: "400",
  },
  objectivesIntroContainer: {
    marginTop: 8,
  },
  objectivesIntroText: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
    lineHeight: 20,
  },
  objectivesCard: {
    backgroundColor: "rgba(19, 91, 236, 0.05)",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(19, 91, 236, 0.1)",
    gap: 14,
    marginVertical: 8,
  },
  objectivesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  objectivesTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  listBlock: {
    gap: 12,
    marginVertical: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  listDotContainer: {
    marginTop: 2,
  },
  listOrderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    width: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    lineHeight: 22,
    fontWeight: "500",
  },
  sectionArea: {
    marginTop: 20,
    gap: 16,
  },
  resourcesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  resourceCount: {
    backgroundColor: "rgba(19, 91, 236, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resourceCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  resourceDetail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  footnote: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
  },
  footnoteText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  emptyText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
