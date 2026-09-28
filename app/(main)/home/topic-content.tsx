import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { LessonsApi } from "../../../src/api/generated/endpoints/lessons-api";
import { Configuration } from "../../../src/api/generated/configuration";
import api, { API_BASE_URL, STORAGE_KEYS } from "../../../src/services/api";
import { StorageService } from "../../../src/services/storage";
import { useToast } from "../../../src/context/ToastContext";
import { LessonDetailDto } from "../../../src/api/generated/models/lesson-detail-dto";
import {
  LessonBlockDto,
  LessonBlockDtoBlockTypeEnum,
} from "../../../src/api/generated/models/lesson-block-dto";
import {
  getApiErrorMessage,
  getRequestErrorMessage,
} from "../../../src/utils/apiError";

type LessonTablePayload = {
  type?: string;
  originalType?: string;
  columns?: unknown[];
  rows?: unknown[][];
};

const normalizePayload = (payload: unknown): Record<string, any> => {
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return { content: payload };
    }
  }
  return payload && typeof payload === "object"
    ? (payload as Record<string, any>)
    : {};
};

const cellText = (value: unknown) => {
  if (value && typeof value === "object" && "content" in value)
    return String((value as { content?: unknown }).content ?? "");
  return value == null ? "" : String(value);
};

const isTablePayload = (payload: LessonTablePayload) =>
  String(payload.type ?? payload.originalType ?? "").toLowerCase() === "table";

const isOrderedList = (payload: Record<string, any>) => {
  const style = String(payload.listStyle ?? payload.type ?? "").toLowerCase();
  return (
    payload.ordered === true ||
    ["ordered", "numbered", "orderedlist"].includes(style)
  );
};

const listItemText = (item: unknown) => cellText(item);

const containsObjectiveMarker = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .includes("objective");

const isObjectivesList = (
  blocks: LessonBlockDto[],
  index: number,
  payload: Record<string, any>,
  items: unknown[],
) => {
  // Newer editor payloads can identify objectives directly.
  if (payload.isObjective === true || payload.isObjectives === true)
    return true;

  const payloadLabels = [
    payload.title,
    payload.heading,
    payload.section,
    payload.label,
  ];
  if (payloadLabels.some(containsObjectiveMarker)) return true;

  // The portal generally writes an Objectives heading or introductory paragraph
  // immediately before the list. Look at those nearby blocks rather than relying
  // on fixed positions in the lesson.
  const nearbyBlocks = blocks.slice(Math.max(0, index - 2), index);
  const hasObjectiveContext = nearbyBlocks.some((nearbyBlock) => {
    const nearbyPayload = normalizePayload(nearbyBlock.payload);
    return (
      containsObjectiveMarker(nearbyPayload.content) ||
      String(nearbyPayload.content ?? "")
        .toLowerCase()
        .includes("by the end of this lesson")
    );
  });

  return (
    hasObjectiveContext ||
    items.some((item) =>
      listItemText(item).toLowerCase().includes("students should be able to"),
    )
  );
};

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

export default function TopicContentScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { topicId, topicTitle } = useLocalSearchParams<{
    topicId: string;
    topicTitle: string;
  }>();

  const { showToast } = useToast();

  const {
    data: lessonDetail = null,
    isPending: isLoading,
    isError,
    error: queryError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["topicContent", topicId],
    queryFn: async () => {
      if (!topicId) throw new Error("Missing topic ID");

      const response = await lessonsApi.getLesson({ lessonUnitId: topicId });

      console.log(
        "[TopicContent] API Response:",
        JSON.stringify(response.data, null, 2),
      );

      if (!response.data.success) {
        throw new Error(
          getApiErrorMessage(response.data, "Failed to load lesson content."),
        );
      }

      return response.data.data || null;
    },
    enabled: !!topicId,
  });

  const error = isError
    ? getRequestErrorMessage(queryError, "An error occurred.")
    : null;

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  const onRefresh = () => {
    refetch();
  };

  const renderBlock = (
    block: LessonBlockDto,
    index: number,
    blocks: LessonBlockDto[],
  ) => {
    const payload = normalizePayload(block.payload);
    if (!block.payload) return null;

    // The admin portal treats tables as a payload shape rather than relying on
    // the block enum, so mobile supports both current and newer API schemas.
    if (isTablePayload(payload)) {
      const columns = Array.isArray(payload.columns) ? payload.columns : [];
      const rows = Array.isArray(payload.rows)
        ? payload.rows.filter(Array.isArray)
        : [];
      if (columns.length === 0 || rows.length === 0) return null;
      const availableWidth = screenWidth - 40;
      const columnWidth = Math.max(
        96,
        Math.floor(availableWidth / Math.min(columns.length, 3)),
      );
      const tableWidth = Math.max(availableWidth, columnWidth * columns.length);

      return (
        <View key={block.id || index} style={styles.tableShell}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            nestedScrollEnabled
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={[styles.lessonTable, { width: tableWidth }]}>
              <View style={styles.tableHeaderRow}>
                {columns.map((column, columnIndex) => (
                  <Text
                    key={columnIndex}
                    style={[styles.tableHeaderCell, { width: columnWidth }]}
                  >
                    {cellText(column)}
                  </Text>
                ))}
              </View>
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  {columns.map((_, columnIndex) => (
                    <Text
                      key={columnIndex}
                      style={[styles.tableCell, { width: columnWidth }]}
                    >
                      {cellText(row[columnIndex])}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }

    // Some editor versions save each item as its own ListItem block.
    // Keep those blocks readable even though older generated clients omit it.
    if (String(block.blockType) === "ListItem") {
      const ordered = isOrderedList(payload);
      return (
        <View key={block.id || index} style={styles.listItem}>
          <View style={styles.listDotContainer}>
            {ordered ? (
              <Text style={styles.listOrderNumber}>{index + 1}.</Text>
            ) : (
              <Ionicons
                name="ellipse"
                size={8}
                color={COLORS.primary}
                style={{ marginTop: 7 }}
              />
            )}
          </View>
          <Text style={styles.listItemText}>{payload.content ?? ""}</Text>
        </View>
      );
    }

    switch (block.blockType) {
      case LessonBlockDtoBlockTypeEnum.Heading:
        // Use H1 style for the very first heading if it matches the main topic,
        // otherwise regular section heading
        const isMainHeading = index === 0;
        return (
          <View key={block.id || index} style={styles.headingBlock}>
            {!isMainHeading && <View style={styles.sectionAccent} />}
            <Text
              style={isMainHeading ? styles.heroTitle : styles.sectionTitle}
            >
              {payload.content}
            </Text>
          </View>
        );

      case LessonBlockDtoBlockTypeEnum.Paragraph:
        const isObjectivesIntro =
          containsObjectiveMarker(payload.content) ||
          String(payload.content ?? "")
            .toLowerCase()
            .includes("by the end of this lesson");

        return (
          <View
            key={block.id || index}
            style={
              isObjectivesIntro
                ? styles.objectivesIntroContainer
                : styles.paragraphBlock
            }
          >
            <Text
              style={
                isObjectivesIntro ? styles.objectivesIntroText : styles.bodyText
              }
            >
              {payload.content}
            </Text>
          </View>
        );

      case LessonBlockDtoBlockTypeEnum.List:
        const items = Array.isArray(payload.items) ? payload.items : [];
        const ordered = isOrderedList(payload);
        const shouldHighlightObjectives = isObjectivesList(
          blocks,
          index,
          payload,
          items,
        );

        return (
          <View
            key={block.id || index}
            style={
              shouldHighlightObjectives
                ? styles.objectivesCard
                : styles.listBlock
            }
          >
            {shouldHighlightObjectives && (
              <View style={styles.objectivesHeader}>
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.objectivesTitle}>Learning Objectives</Text>
              </View>
            )}

            {items.map((item: unknown, i: number) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.listDotContainer}>
                  {ordered ? (
                    <Text style={styles.listOrderNumber}>{i + 1}.</Text>
                  ) : (
                    <Ionicons
                      name="ellipse"
                      size={8}
                      color={COLORS.primary}
                      style={{ marginTop: 7 }}
                    />
                  )}
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemText}>{listItemText(item)}</Text>
                  {item &&
                    typeof item === "object" &&
                    Array.isArray((item as any).children) &&
                    (item as any).children.map(
                      (child: any, childIndex: number) => {
                        const childItems = Array.isArray(child?.items)
                          ? child.items
                          : [];
                        const childOrdered = isOrderedList(child ?? {});
                        return (
                          <View key={childIndex} style={styles.nestedList}>
                            {childItems.map(
                              (childItem: unknown, nestedIndex: number) => (
                                <View key={nestedIndex} style={styles.listItem}>
                                  <View style={styles.listDotContainer}>
                                    {childOrdered ? (
                                      <Text style={styles.listOrderNumber}>
                                        {nestedIndex + 1}.
                                      </Text>
                                    ) : (
                                      <Ionicons
                                        name="ellipse"
                                        size={6}
                                        color="#64748B"
                                        style={{ marginTop: 8 }}
                                      />
                                    )}
                                  </View>
                                  <Text style={styles.listItemText}>
                                    {listItemText(childItem)}
                                  </Text>
                                </View>
                              ),
                            )}
                          </View>
                        );
                      },
                    )}
                </View>
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
      <StatusBar style="dark" />

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
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
              .slice()
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
              .map((block, index, blocks) => renderBlock(block, index, blocks))}

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
    alignItems: "stretch",
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 4,
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
  listItemContent: {
    flex: 1,
  },
  nestedList: {
    marginTop: 8,
    marginLeft: 8,
    gap: 7,
  },
  tableShell: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#DBE3EF",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  tableScrollContent: {
    minWidth: "100%",
  },
  lessonTable: {
    minWidth: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  tableHeaderCell: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#1E3A5F",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  tableCell: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
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
