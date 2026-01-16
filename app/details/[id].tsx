import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Item } from "../../types";
import { Header } from "../../components/Header";
import { findItemById } from "../../utils/helpers";
import { ITEMS } from "../../data/mockData";
import { SPACING } from "../../constants/spacing";
import { TYPO } from "../../constants/typography";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

export default function DetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const item: Item | undefined = findItemById(ITEMS, id);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={item?.title ?? "Details"}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.body}>
          {item?.description ?? "Item not found."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  body: { fontSize: TYPO.body },
});
