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

  const handlePlayAgain = () => {
    if (!roomId) {
      alert("No room created yet");
      return;
    }
    
    // Reset the game state
    socket.emit("playAgain", { roomId }, (res?: { ok?: boolean; error?: string }) => {
      if (res?.ok) {
        // Game reset successfully, clear the word input
        setWord("");
      } else {
        alert(res?.error || "Failed to reset game");
      }
    });
  };

  const copyRoomCode = () => {
    if (roomId) {
      // In a real app, you'd use Clipboard.setString(roomId)
      alert(`Room code copied: ${roomId}`);
    }
  };

  // Show host results screen if game has ended
  if (room && room.battle.started && room.battle.winner) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <NavHeader greetingName={name} />
        
        <View className="flex-1 px-4 pt-2">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold text-gray-800">Battle Royale</Text>
            {room.battle.winner && (
              <Text className="text-lg text-blue-600 font-semibold mt-1">
                Winner: {room.players[room.battle.winner]?.name || "Unknown"}
              </Text>
            )}
          </View>

          {/* Round Results */}
          <View className="items-center mb-8">
            <View className="flex-row items-center gap-2 mb-4">
              <Text className="text-lg">🏆</Text>
              <Text className="text-lg font-semibold text-gray-700">Round Results</Text>
            </View>
            
            {/* Revealed Word */}
            {room.battle.lastRevealedWord && (
              <View className="flex-row gap-2 mb-6">
                {room.battle.lastRevealedWord.toUpperCase().split('').map((letter, i) => (
                  <View
                    key={i}
                    className="w-12 h-12 rounded border items-center justify-center"
                    style={{
                      backgroundColor: "#6AAA64",
                      borderColor: "#6AAA64",
                    }}
                  >
                    <Text className="text-white font-extrabold text-lg">
                      {letter}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Podium */}
            {room.battle.winner && (
              <View className="bg-white rounded-xl p-6 items-center shadow-sm mb-6">
                <Text className="text-2xl mb-2">👑</Text>
                <Text className="text-xl mb-1">🥇</Text>
                <Text className="text-xl font-bold text-gray-800 mb-1">
                  {room.players[room.battle.winner]?.name || "Unknown"}
                </Text>
                <Text className="text-sm text-gray-500">1</Text>
              </View>
            )}
          </View>

          {/* New Game Section */}
          <View className="bg-white rounded-xl p-6">
            <Text className="text-lg font-semibold text-gray-700 text-center mb-4">
              Enter a word to start the game
            </Text>
            
            {/* Word Input Tiles */}
            <View className="flex-row gap-2 justify-center mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <TextInput
                  key={i}
                  className="w-12 h-12 rounded border text-center text-lg font-bold"
                  style={{
                    backgroundColor: i === 0 ? "#E3F2FD" : "#F5F5F5",
                    borderColor: i === 0 ? "#2196F3" : "#E0E0E0",
                  }}
                  value={word[i] || ""}
                  onChangeText={(text) => {
                    if (text.length <= 1 && /^[A-Za-z]*$/.test(text)) {
                      const newWord = word.split('');
                      newWord[i] = text.toUpperCase();
                      setWord(newWord.join('').slice(0, 5));
                    }
                  }}
                  maxLength={1}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              ))}
            </View>

            {/* Generate Button */}
            <View className="flex-row items-center justify-center gap-2 mb-4">
              <Pressable
                onPress={() => alert("Generate word feature coming soon!")}
                className="flex-row items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg"
              >
                <Text className="text-lg">✨</Text>
                <Text className="text-purple-700 font-medium">Generate</Text>
              </Pressable>
              <Text className="text-gray-500 text-sm">Enter 5-letter word</Text>
            </View>

            {/* Start Game Button */}
            <Pressable
              onPress={handleStartGame}
              className={`rounded-lg h-16 items-center justify-center ${
                word.length === 5 ? "bg-green-400" : "bg-gray-300"
              }`}
              disabled={word.length !== 5}
            >
              <Text className={`font-bold ${
                word.length === 5 ? "text-white" : "text-gray-500"
              }`}>
                Start Game
              </Text>
            </Pressable>
          </View>

          {/* Player Stats */}
          <View className="bg-white rounded-xl p-4 mt-4">
            <Text className="text-lg font-semibold text-gray-700 mb-3">Players ({Object.values(room.players).filter(p => p.id !== room.hostId).length}/6)</Text>
            
            {Object.values(room.players).filter(p => p.id !== room.hostId).map((player) => (
              <View key={player.id} className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                    <Text className="text-sm font-semibold text-gray-700">
                      {(player.name || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-medium">{player.name || "Unknown"}</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <Text className="text-sm text-gray-500">W:{player.wins || 0}</Text>
                  <Text className="text-sm text-gray-500">S:{player.streak || 0}</Text>
                  <View
                    className={`w-2 h-2 rounded-full ${
                      player.disconnected ? "bg-red-400" : "bg-green-400"
                    }`}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <View className="gap-2">
            <Pressable
              onPress={handleStartGame}
              className="bg-green-400 rounded-lg mt-4 h-16 items-center justify-center mx-4"
            >
              <Text className="text-white font-bold">Start Game</Text>
            </Pressable>
            
            {room?.battle?.winner && (
              <Pressable
                onPress={handlePlayAgain}
                className="bg-blue-400 rounded-lg h-16 items-center justify-center mx-4"
              >
                <Text className="text-white font-bold">Play Again</Text>
              </Pressable>
            )}
          </View>
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
