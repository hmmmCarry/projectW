import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NavHeader() {
  const router = useRouter();
  return (
    <SafeAreaView className="w-full">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center space-x-3"
        >
          <Ionicons name="chevron-back" size={24} color={"black"} />
          <Text>Go Back</Text>
        </Pressable>
        <View className="flex-row gap-2 items-center">
          <Ionicons name="person-circle-outline" size={24} color="black" />
          <Feather name="sun" size={24} color="black" />
        </View>
      </View>
    </SafeAreaView>
  );
}
