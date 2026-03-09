import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../src/constants/colors";
import { DashboardHeader } from "../../../src/components/DashboardHeader";
import { SubjectCard } from "../../../src/components/SubjectCard";
import { SUBJECTS, Subject } from "../../../src/data/subjectData";
import { useRouter } from "expo-router";

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

  const handleSubjectPress = (id: string, name: string) => {
    router.push({
      pathname: "/(main)/home/topics",
      params: { id, name }
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
          onPress={() => handleSubjectPress(item.id, item.name)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <DashboardHeader />
      
      <View style={styles.mainContent}>
        <FlatList
          data={SUBJECTS}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.gridContent,
            { 
              paddingBottom: insets.bottom + 40,
              paddingHorizontal: 16 
            }
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.headerTitle}>My Subjects</Text>
            </View>
          }
        />
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
});
