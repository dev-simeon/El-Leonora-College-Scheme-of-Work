import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { COLORS } from "../constants/colors";

interface SubjectCardProps {
  name: string;
  weekProgress: string;
  cardColor: string;
  spineColor: string;
  iconColor: string;
  onPress?: () => void;
}

const BOOK_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuA5ys5_GWyV4hgTOkLOVeJX5GtYqvJbEUZhUiH6bIxCyOFHfWuhHAZjmHhUL3rQoR7u51L8iNtRJthk5hLsXou0iaOWVVH-e-OpGfOUAKpfGpTOFsyTyfMv8IzHvPn0b61cqAS5fQlyaBKfdB-O3hH7F-9nG8LD5frSlzHy1bh5snM7_VInYvqNrjoIT6lPJXVAFEQXpIxLmIULl3ALivbuL5LPK6nkU8prqGgo8FqGi0r5ECb2EiMe4-oQJOPisbYiFvSq8dYv8NY";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export function SubjectCard({
  name,
  weekProgress,
  cardColor,
  spineColor,
  iconColor,
  onPress,
}: SubjectCardProps) {
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.imageContainer, { backgroundColor: cardColor }]}>
          {/* Spine effect */}
          <View style={[styles.spine, { backgroundColor: spineColor, opacity: 0.3 }]} />
          
          {/* Animated-style blur circle */}
          <View style={[styles.blurCircle, { backgroundColor: iconColor, opacity: 0.15 }]} />
          
          <Image 
            source={{ uri: BOOK_IMAGE }} 
            style={styles.image} 
            resizeMode="cover"
          />

          {/* Subtle white fade at the bottom */}
          <LinearGradient
            colors={["transparent", "rgba(255, 255, 255, 0.4)"]}
            style={styles.gradientOverlay}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.weekText}>{weekProgress}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 2,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    height: 112,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    ...StyleSheet.absoluteFill,
    opacity: 0.2, // Drastically reduced to show mix-blend effect simulation
  },
  blurCircle: {
    position: "absolute",
    bottom: -16,
    right: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  centerIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    position: "absolute",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
  spine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 10,
  },
  content: {
    padding: 12,
    paddingBottom: 28, // Increased padding as requested
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  weekText: {
    fontSize: 12,
    color: "#64748B",
  },
});
