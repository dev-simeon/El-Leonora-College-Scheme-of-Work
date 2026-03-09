import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { TOPIC_CONTENT, TopicResource, LearningObjective } from "../../../src/data/topicContentData";

export default function TopicContentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topicId, topicTitle } = useLocalSearchParams<{ 
    topicId: string; 
    topicTitle: string;
  }>();

  const content = TOPIC_CONTENT[topicId];

  const getResourceIcon = (type: TopicResource['type']) => {
    switch (type) {
      case 'pdf': return 'file-pdf-box';
      case 'video': return 'play-circle';
      case 'link': return 'link-variant';
      default: return 'file-document';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header with Top Inset */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {topicTitle || "Topic Content"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!content ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Content Available</Text>
            <Text style={styles.emptyText}>
              Learning materials for this topic are currently being prepared.
            </Text>
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>
                {topicTitle || content.weekTitle}
              </Text>
              
              <View style={styles.metaChips}>
                <View style={styles.chip}>
                  <Ionicons name="flask" size={14} color="#8B5CF6" />
                  <Text style={styles.chipText}>Science</Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="time" size={14} color="#F59E0B" />
                  <Text style={styles.chipText}>{content.duration}</Text>
                </View>
              </View>
            </View>

            {/* Objectives Card */}
            <View style={styles.objectivesSection}>
              <View style={styles.objectivesCard}>
                <View style={styles.objectivesHeader}>
                  <MaterialCommunityIcons name="target" size={20} color={COLORS.primary} />
                  <Text style={styles.objectivesTitle}>Learning Objectives</Text>
                </View>
                
                <Text style={styles.objectivesIntro}>
                  By the end of this lesson, you will be able to:
                </Text>

                <View style={styles.objectivesList}>
                  {content.learningObjectives.map((objective: LearningObjective) => (
                    <View key={objective.id} style={styles.objectiveItem}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      <Text style={styles.objectiveText}>{objective.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Introduction Body */}
            <View style={styles.bodySection}>
              <Text style={styles.bodyText}>{content.introduction}</Text>
            </View>

            {/* Content Sections */}
            {content.sections.map((section, index) => (
              <View key={index} style={styles.bodySection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                
                <Text style={styles.bodyText}>{section.content}</Text>
                
                {section.quote && (
                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteMark}>“</Text>
                    <Text style={styles.quoteText}>{section.quote}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Resources (Empty State for now) */}
            <View style={styles.section}>
              <View style={styles.resourcesHeader}>
                <Text style={styles.sectionTitleMain}>Topic Resources</Text>
                <View style={styles.resourceCount}>
                  <Text style={styles.resourceCountText}>0 Files</Text>
                </View>
              </View>
              
              <View style={styles.resourcesEmpty}>
                <Ionicons name="folder-open-outline" size={40} color="#94A3B8" />
                <Text style={styles.resourcesEmptyText}>No resources shared yet</Text>
              </View>
            </View>

            {/* Footnote */}
            <View style={styles.footnote}>
              <Text style={styles.footnoteText}>
                Source: {content.source}
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  scrollContent: {
    padding: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  contentWrapper: {
    gap: 28,
  },
  heroSection: {
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 36,
    marginBottom: 16,
  },
  metaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  objectivesSection: {
    marginVertical: 4,
  },
  objectivesCard: {
    backgroundColor: "rgba(19, 91, 236, 0.05)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(19, 91, 236, 0.1)",
  },
  objectivesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  objectivesTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  objectivesIntro: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 16,
  },
  objectivesList: {
    gap: 14,
  },
  objectiveItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  objectiveText: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
    lineHeight: 22,
  },
  bodySection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 6,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    color: "#334155",
    fontWeight: "400",
  },
  quoteBox: {
    marginTop: 8,
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    position: "relative",
  },
  quoteMark: {
    fontSize: 40,
    color: "#CBD5E1",
    fontWeight: "800",
    position: "absolute",
    top: 8,
    left: 8,
    opacity: 0.5,
  },
  quoteText: {
    fontSize: 17,
    color: "#1E293B",
    fontStyle: "italic",
    lineHeight: 26,
    paddingLeft: 12,
  },
  section: {
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
    borderRadius: 12,
  },
  resourceCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  resourcesEmpty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    gap: 12,
  },
  resourcesEmptyText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  footnote: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  footnoteText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
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
    fontWeight: "700",
    color: "#475569",
  },
  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 40,
  }
});
