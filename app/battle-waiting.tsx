import { getSocket } from "@/lib/socket";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
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

type Params = { roomId?: string };

export default function BattleWaiting() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);
  const { roomId: roomParam } = useLocalSearchParams<Params>();
  const roomId = typeof roomParam === "string" ? roomParam : "";

  const [room, setRoom] = useState<RoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);

  useEffect(() => {
    if (!socket.connected) {
      console.log("Connecting socket...");
      socket.connect();
    }
    
    const handleConnect = () => {
      console.log("Socket connected in waiting screen, ID:", socket.id);
      setSocketId(socket.id ?? null);
    };
    
    const handleRoomState = (state: RoomState) => {
      console.log("Room state received in waiting screen:", state);
      setRoom(state);
      // If game has started, navigate to player game screen
      if (state.battle.started && socketId && state.players[socketId]) {
        console.log("Game started, navigating to player screen");
        router.push(`/battle-player-start?roomId=${roomId}`);
      }
    };
    
    socket.on("connect", handleConnect);
    socket.on("roomState", handleRoomState);
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("roomState", handleRoomState);
    };
  }, [socket, socketId, roomId, router]);

  const allPlayers = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const players = useMemo(() => allPlayers.filter(p => p.id !== room?.hostId), [allPlayers, room?.hostId]);
  const me = socketId ? room?.players?.[socketId] : undefined;
  
  console.log("Waiting room debug:", {
    roomId,
    socketId,
    allPlayers: allPlayers.length,
    players: players.length,
    hostId: room?.hostId,
    playerList: players.map(p => ({ id: p.id, name: p.name }))
  });

  const getStatusMessage = () => {
    if (!room) return "Connecting to room...";
    if (!room.battle.hasSecret) return "Waiting for host to set a word...";
    if (!room.battle.started) return "Waiting for host to start the game...";
    return "Game starting...";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 px-4 pt-2">
        <View className="items-center mb-6">
          <Ionicons name="hourglass-outline" size={48} color="#6b7280" />
          <Text className="text-lg font-semibold text-gray-700 mt-2">Waiting Room</Text>
          <Text className="text-sm text-gray-500 mt-1">{getStatusMessage()}</Text>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold">Players ({players.length}/6)</Text>
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 bg-green-400 rounded-full" />
              <Text className="text-sm text-gray-600">Online</Text>
            </View>
          </View>

          {players.length === 0 ? (
            <View className="py-8">
              <Text className="text-gray-500 text-center">No players joined yet</Text>
              <Text className="text-xs text-gray-400 text-center mt-2">
                Debug: {allPlayers.length} total players, host: {room?.hostId}
              </Text>
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={(p) => p.id}
              extraData={players.length}
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                      <Text className="text-sm font-semibold text-gray-700">
                        {(item.name || "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-medium">{item.name || "Unknown"}</Text>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <Text className="text-sm text-gray-500">W:{item.wins || 0}</Text>
                    <Text className="text-sm text-gray-500">S:{item.streak || 0}</Text>
                    <View
                      className={`w-2 h-2 rounded-full ${
                        item.disconnected ? "bg-red-400" : "bg-green-400"
                      }`}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {me && (
          <View className="bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-800 font-medium text-center">
              You're ready to play! Waiting for the game to start...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
