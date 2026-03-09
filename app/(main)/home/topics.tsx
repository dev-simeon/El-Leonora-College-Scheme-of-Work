import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../src/constants/colors";
import { SUBJECT_TOPICS, WeekData, Topic } from "../../../src/data/topicsData";

export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const subjectTopics = SUBJECT_TOPICS[id];
  const [selectedTerm, setSelectedTerm] = useState(subjectTopics?.term || "1st Term");
  const [isTermMenuVisible, setIsTermMenuVisible] = useState(false);

  const handleTermSelect = (term: string) => {
    setSelectedTerm(term);
    setIsTermMenuVisible(false);
  };

  const handleTopicPress = (topic: Topic) => {
    router.push({
      pathname: "/(main)/home/topic-content",
      params: { 
        topicId: topic.id, 
        topicTitle: topic.title,
        subjectId: id
      }
    });
  };

  if (!subjectTopics) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.headerTitle}>{name || "Topics"}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No topics found for this subject.</Text>
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
        <Text style={styles.topicTitle}>{topic.title}</Text>
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
      </View>
      <View style={styles.topicsList}>
        {item.topics.map(renderTopic)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header with Top Inset */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {subjectTopics.subjectName}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={subjectTopics.weeks}
        renderItem={renderWeek}
        keyExtractor={(item) => `week-${item.weekNumber}`}
        ListHeaderComponent={
          <View style={styles.filterSection}>
            <View style={styles.termFilterWrapper}>
              <Pressable 
                style={[styles.termFilter, isTermMenuVisible && styles.termFilterActive]}
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
                    <Text style={[styles.termOptionText, selectedTerm === "1st Term" && styles.termOptionTextActive]}>1st Term</Text>
                    {selectedTerm === "1st Term" && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                  </Pressable>
                  <Pressable 
                    style={styles.termOption} 
                    onPress={() => handleTermSelect("2nd Term")}
                  >
                    <Text style={[styles.termOptionText, selectedTerm === "2nd Term" && styles.termOptionTextActive]}>2nd Term</Text>
                    {selectedTerm === "2nd Term" && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                  </Pressable>
                  <Pressable 
                    style={styles.termOption} 
                    onPress={() => handleTermSelect("3rd Term")}
                  >
                    <Text style={[styles.termOptionText, selectedTerm === "3rd Term" && styles.termOptionTextActive]}>3rd Term</Text>
                    {selectedTerm === "3rd Term" && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
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
  topicsList: {
    gap: 12,
  },
  topicCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
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
});
