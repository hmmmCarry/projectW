import NavHeader from "@/components/NavHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BattleRoyaleLobby() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      alert("Please enter a room code");
      return;
    }
    router.push(`/battle-player-start?roomId=${roomCode}&name=${encodeURIComponent(playerName)}`);
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    // Auto-create room and navigate directly to create screen with roomId
    router.push(`/create?name=${encodeURIComponent(playerName)}&autoCreate=true`);
  };

  return (
    <SafeAreaView>
      <View className="bg-gray-100 px-4">
        <NavHeader />

        <View className="flex-row items-center space-x-3 justify-start px-4 mt-4">
          <MaterialCommunityIcons name="sword-cross" size={24} color="black" />
          <Text className="text-2xl font-bold">Battle Royale</Text>
        </View>

        <Text className="text-lg font-semibold mt-4 px-4">Enter your name</Text>
        <TextInput
          className="bg-gray-300 rounded-lg p-2 mt-2 h-16 mx-4"
          placeholder="Your name"
          placeholderTextColor={"black"}
          value={playerName}
          onChangeText={setPlayerName}
        />

        <Text className="text-lg font-semibold mt-4 px-4">Join existing room</Text>
        <View className="flex-row gap-2 w-full px-4">
          <TextInput
            className="w-3/4 bg-gray-300 rounded-lg p-2 mt-2 h-16"
            placeholder="Enter code to join game room"
            placeholderTextColor={"black"}
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toUpperCase())}
          />
          <Pressable
            onPress={handleJoinGame}
            className="w-1/4 bg-fuchsia-400 rounded-lg p-2 mt-2 h-16 items-center justify-center"
          >
            <Text className="text-white font-bold">Join Game</Text>
          </Pressable>
        </View>

        <View className="bg-gray-200 h-1 mt-4"></View>

        <Pressable
          onPress={handleCreateRoom}
          className="bg-fuchsia-400 rounded-lg mt-4 h-16 items-center justify-center mx-4"
        >
          <Text className="text-white font-bold">Create Room</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
