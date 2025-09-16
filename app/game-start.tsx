import { Fontisto } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GameStart() {
  return (
    <SafeAreaView className="flex-1">
      <View className="w-full px-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
          <View className="flex-row size-16 rounded-xl items-center justify-center border mt-4 mb-4">
            <Text>Game Area</Text>
          </View>
        </ScrollView>

        <View className="bg-gray-400 h-1"></View>

        <ScrollView
          horizontal
          contentContainerStyle={{ gap: 15 }}
          showsHorizontalScrollIndicator={false}
        >
          <View className="py-4 w-72">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center px-2">
                <View className="flex-row gap-4 w-full">
                  <Fontisto name="person" size={24} color="black" />
                  <View>
                    <Text>Username</Text>
                    <Text>W:0 STREAK:0</Text>
                  </View>
                </View>
              </View>
            </View>
            <View className="h-4/5 bg-gray-300 w-full rounded-xl"></View>
          </View>
          <View className="py-4 w-72">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center px-2">
                <View className="flex-row gap-4 w-full">
                  <Fontisto name="person" size={24} color="black" />
                  <View>
                    <Text>Username</Text>
                    <Text>W:0 STREAK:0</Text>
                  </View>
                </View>
              </View>
            </View>
            <View className="h-4/5 bg-gray-300 w-72 rounded-xl"></View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
