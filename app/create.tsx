import NavHeader from "@/components/NavHeader";
import { getSocket } from "@/lib/socket";
import { Feather, Fontisto } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Player = {
  id: string;
  name?: string;
  wins?: number;
  streak?: number;
  disconnected?: boolean;
};

type RoomState = {
  id: string;
  mode: "duel" | "battle";
  hostId?: string;
  players: Record<string, Player>;
  battle: {
    started: boolean;
    winner: string | null;
    hasSecret: boolean;
    secret: null;
    lastRevealedWord: string | null;
  };
};

export default function Create() {
  const socket = useMemo(() => getSocket(), []);
  const { name: nameParam, autoCreate } = useLocalSearchParams<{ name?: string; autoCreate?: string }>();
  const [name, setName] = useState(nameParam || "Host");
  const [word, setWord] = useState("");
  const [creating, setCreating] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const handleRoomState = (state: RoomState) => {
      setRoom(state);
      setRoomId(state.id);
    };
    socket.on("roomState", handleRoomState);
    return () => {
      socket.off("roomState", handleRoomState);
    };
  }, [socket]);

  // Auto-create room if coming from lobby
  useEffect(() => {
    if (autoCreate === "true" && !roomId && !creating) {
      handleCreateRoom();
    }
  }, [autoCreate, roomId, creating]);

  const allPlayers = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  // Exclude host from player list
  const players = useMemo(() => allPlayers.filter(p => p.id !== room?.hostId), [allPlayers, room?.hostId]);
  const playerCount = players.length;

  const handleCreateRoom = () => {
    if (creating) return;
    setCreating(true);
    socket.emit(
      "createRoom",
      { name: name || "Host", mode: "battle" },
      (res?: { roomId?: string; error?: string }) => {
        if (!res?.roomId) {
          setCreating(false);
          alert(res?.error || "Failed to create room");
          return;
        }
        const id = res.roomId;
        setRoomId(id);
        setCreating(false);
      }
    );
  };

  const handleStartGame = () => {
    if (!roomId) {
      alert("No room created yet");
      return;
    }
    if (!word || word.length !== 5) {
      alert("Please enter a 5-letter word");
      return;
    }
    
    // Set the word and start the battle in sequence
    socket.emit("setHostWord", { roomId, secret: word.toUpperCase() }, (res?: { ok?: boolean; error?: string }) => {
      if (res?.ok) {
        // Word set successfully, now start the battle
        socket.emit("startBattle", { roomId }, (startRes?: { ok?: boolean; error?: string }) => {
          if (startRes?.ok) {
            // Battle started successfully, navigate to host viewer
            router.push(`/game-start?roomId=${roomId}`);
          } else {
            alert(startRes?.error || "Failed to start battle");
          }
        });
      } else {
        alert(res?.error || "Invalid word");
      }
    });
  };

  const copyRoomCode = () => {
    if (roomId) {
      // In a real app, you'd use Clipboard.setString(roomId)
      alert(`Room code copied: ${roomId}`);
    }
  };

  return (
    <SafeAreaView>
      <NavHeader greetingName={name} />
      <View className="min-h-full bg-gray-100 px-4">
        <View className="space-x-3 justify-start px-4">
          <Text className="text-2xl font-bold">Create a game room</Text>
          <Text className="text-md font-bold">
            Tip: Share the room code with friends to play together
          </Text>
        </View>

        {roomId ? (
          <View className="flex-row gap-2 w-full px-4">
            <TextInput
              className="w-3/4 bg-gray-300 rounded-lg p-2 mt-4 h-16"
              placeholder="Room Code"
              placeholderTextColor={"black"}
              value={roomId}
              editable={false}
            />
            <Pressable
              onPress={copyRoomCode}
              className="w-1/4 bg-fuchsia-400 rounded-lg p-2 mt-4 h-16 items-center justify-center"
            >
              <Feather name="copy" size={24} color="white" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={creating}
            onPress={handleCreateRoom}
            className="bg-fuchsia-400 rounded-lg mt-4 h-16 items-center justify-center mx-4"
          >
            <Text className="text-white font-bold">
              {creating ? "Creating..." : "Create Room"}
            </Text>
          </Pressable>
        )}

        <Text className="text-lg font-semibold mt-4 px-4">
          Enter a word to start the game
        </Text>

        <TextInput
          className="bg-gray-300 rounded-lg p-2 mt-4 h-16 mx-4"
          placeholder="Enter 5-letter word"
          placeholderTextColor={"black"}
          value={word}
          onChangeText={(text) => setWord(text.toUpperCase())}
          maxLength={5}
        />

        {roomId && (
          <Pressable
            onPress={handleStartGame}
            className="bg-green-400 rounded-lg mt-4 h-16 items-center justify-center mx-4"
          >
            <Text className="text-white font-bold">Start Game</Text>
          </Pressable>
        )}

        <Text className="text-red-400 mt-4 font-semibold px-4">
          WAIT FOR YOUR FRIENDS TO JOIN BEFORE YOU START THE GAME
        </Text>

        <View className="bg-gray-200 h-1 mt-4"></View>
        <View className="flex-row justify-between px-4">
          <Text className="text-lg font-semibold mt-4">PLAYERS</Text>
          <Text className="text-lg font-semibold mt-4">{playerCount}/6 ONLINE</Text>
        </View>

        {players.length === 0 ? (
          <View className="px-4 py-8">
            <Text className="text-gray-500 text-center">No players joined yet</Text>
          </View>
        ) : (
          players.map((player) => (
            <View key={player.id} className="w-full border-t-2 border-gray-400 mt-4 px-4">
              <View className="flex-row w-full mt-1 items-center gap-4">
                <Fontisto name="person" size={24} color="black" />
                <Text className="text-lg flex-1">{player.name || "Unknown"}</Text>
                <Text className="text-lg">W:{player.wins || 0}</Text>
                <Text className="text-lg">S:{player.streak || 0}</Text>
                <View
                  className={`w-3 h-3 rounded-full ${
                    player.disconnected ? "bg-red-400" : "bg-green-400"
                  }`}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}
