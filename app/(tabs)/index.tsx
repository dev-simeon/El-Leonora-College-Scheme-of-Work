import React from "react";
import { View, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { Header } from "../../components/Header";
import { ItemCard } from "../../components/ItemCard";
import { ITEMS } from "../../data/mockData";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types";
import { SPACING } from "../../constants/spacing";

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function handlePress(id: string) {
    navigation.navigate("Details", { id });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Home" />
      <FlatList
        contentContainerStyle={{ padding: SPACING.md }}
        data={ITEMS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ItemCard
            id={item.id}
            title={item.title}
            subtitle={item.subtitle}
            onPress={handlePress}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
