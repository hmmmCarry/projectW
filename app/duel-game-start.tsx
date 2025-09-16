import GameKeyboard from "@/components/Keyboard";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OpponentProgressModal } from "./opponent-progression-modal";
import { PlayerPill } from "./player-pill";

export default function DuelGameStart() {
    const [showOppModal, setShowOppModal] = useState(false);

  return (
    <SafeAreaView className="flex-1">
      <View className="min-h-full bg-gray-100 px-4">
        <View className="flex-row items-center space-x-3">
          <Ionicons name="chevron-back" size={24} color={"black"} />
          <Text>Go Back</Text>
        </View>

        <PlayerPill
  name="Tipsy preacher"
  avatar="🧪"
  wins={0}
  streak={0}
  online
  guessesCount={2}   // show 2/6 progress, scaled into the 4x4 grid
/>

      <OpponentProgressModal
        visible={showOppModal}
        onClose={() => setShowOppModal(false)}
        recent={[
          ["present", "correct", "absent", "absent", "idle"],
          ["absent", "present", "idle", "idle", "idle"],
        ]}
      />

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
