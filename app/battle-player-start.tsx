import GameKeyboard from "@/components/Keyboard";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BattleProgressStrip from "./battle-opponent-strip";

export default function BattlePlayerGameStart() {
  const [showOppModal, setShowOppModal] = useState(false);

  // Temporary data while sockets aren’t wired
  const players = [
    { id: "me",  name: "Tipsy preacher", avatarEmoji: "🧪", wins: 0, streak: 0, guesses: 0, online: true },
    { id: "p2",  name: "player2",        avatarEmoji: "🦊", wins: 1, streak: 1, guesses: 3, online: true },
    { id: "p3",  name: "player3",        avatarEmoji: "🐱", wins: 0, streak: 0, guesses: 2, online: false },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F6F6FE]">
      <View className="flex-1 px-4">
        {/* Top bar */}
        <View className="flex-row items-center gap-3 py-2">
          <Ionicons name="chevron-back" size={24} color={"#0f172a"} />
          <Text className="text-slate-900">Go back</Text>
        </View>

        {/* Opponents strip (horizontally scrollable) */}
        <BattleProgressStrip players={players} style={{ marginTop: 6 }} />

        {/* Section label */}
        <View className="w-full items-center mt-2">
          <Text className="font-semibold text-slate-700">Guesses</Text>
        </View>

        {/* Board area grows to fill available space */}
        <View className="flex-1 mx-2 my-2 rounded-2xl bg-gray-300" />

        {/* Game keyboard pinned at bottom */}
        <GameKeyboard onKeyPress={(key: string) => alert(key)} />
      </View>
    </SafeAreaView>
  );
}
