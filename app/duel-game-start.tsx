import GameKeyboard from "@/components/Keyboard";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DuelGameStart() {
  return (
    <SafeAreaView className="flex-1">
      <View className="min-h-full bg-gray-100 px-4">
        <View className="flex-row items-center space-x-3">
          <Ionicons name="chevron-back" size={24} color={"black"} />
          <Text>Go Back</Text>
        </View>

        <View className="border w-full h-16 rounded-2xl mt-2"></View>

        <View className="flex-row items-center justify-center gap-2 h-20 rounded-2xl mt-1">
          <View className="size-16 rounded-2xl bg-gray-200"></View>
          <View className="size-16 rounded-2xl bg-gray-200"></View>
          <View className="size-16 rounded-2xl bg-gray-200"></View>
          <View className="size-16 rounded-2xl bg-gray-200"></View>
          <View className="size-16 rounded-2xl bg-gray-200"></View>
        </View>

        <View className="w-full justify-center items-center mt-1">
          <Text className="font-semibold">Guesses</Text>
        </View>

        <View className="h-80 bg-gray-300 mx-4 rounded-2xl mt-1 "></View>

        <GameKeyboard onKeyPress={(key: string) => alert(key)} />
      </View>
    </SafeAreaView>
  );
}
