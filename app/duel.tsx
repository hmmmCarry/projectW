import NavHeader from "@/components/NavHeader";
import { getSocket } from "@/lib/socket";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Duel() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);

  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const handleConnect = () => setStatus(null);
    const handleError = (err: Error) => {
      setError(err.message || "Connection error");
      setLoading(null);
    };
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };
  }, [socket]);

  const ensureName = () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Enter a display name first.");
      return null;
    }
    return trimmed;
  };

  const handleCreate = () => {
    const name = ensureName();
    if (!name || loading) return;
    setError(null);
    setStatus(null);
    setLoading("create");
    socket.emit(
      "createRoom",
      { name, mode: "duel" },
      (res?: { roomId?: string; error?: string }) => {
        setLoading(null);
        if (res?.roomId) {
          setStatus(`Room ${res.roomId} created.`);
          router.push({
            pathname: "/duel-game-start",
            params: {
              roomId: res.roomId,
              name,
              host: "1",
            },
          });
        } else {
          setError(res?.error || "Could not create room.");
        }
      }
    );
  };

  const handleJoin = () => {
    const name = ensureName();
    if (!name || loading) return;
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setError("Enter a valid room code.");
      return;
    }
    setError(null);
    setStatus(null);
    setLoading("join");
    socket.emit(
      "joinRoom",
      { name, roomId: code },
      (res?: { ok?: boolean; error?: string }) => {
        setLoading(null);
        if (res?.ok) {
          setStatus(`Joined ${code}.`);
          router.push({
            pathname: "/duel-game-start",
            params: {
              roomId: code,
              name,
              host: "0",
            },
          });
        } else {
          setError(res?.error || "Could not join room.");
        }
      }
    );
  };

  return (
    <SafeAreaView>
      <View className=" bg-gray-100 px-4 pb-6">
        <NavHeader />

        <View className="flex-row items-center space-x-3 justify-start mt-4">
          <MaterialCommunityIcons name="sword-cross" size={24} color="black" />
          <Text className="text-2xl font-bold">Duel (1x1)</Text>
        </View>

        <View className="mt-5">
          <Text className="text-xs text-neutral-600 mb-1">Display name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            className="w-full bg-gray-300 rounded-lg px-3 py-3 h-12"
            placeholder="How should other players see you?"
            placeholderTextColor="rgba(0,0,0,0.4)"
            autoCapitalize="words"
            maxLength={18}
          />
        </View>

        <View className="flex-row gap-2 w-full mt-4">
          <TextInput
            value={joinCode}
            onChangeText={(txt) => setJoinCode(txt.toUpperCase())}
            className="w-3/4 bg-gray-300 rounded-lg p-2 h-16"
            placeholder="Enter code to join game room"
            placeholderTextColor="black"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
          <Pressable
            onPress={handleJoin}
            disabled={loading === "join"}
            className={`w-1/4 rounded-lg p-2 mt-0 h-16 items-center justify-center ${
              loading === "join" ? "bg-fuchsia-200" : "bg-fuchsia-400"
            }`}
          >
            <Text className="text-white font-bold">
              {loading === "join" ? "Joining" : "Join"}
            </Text>
          </Pressable>
        </View>

        <View className="bg-gray-200 h-1 mt-4" />

        <Pressable
          onPress={handleCreate}
          disabled={loading === "create"}
          className={`rounded-lg mt-4 h-16 items-center justify-center mx-4 ${
            loading === "create" ? "bg-fuchsia-200" : "bg-fuchsia-400"
          }`}
        >
          <Text className="text-white font-bold">
            {loading === "create" ? "Creating" : "Create Room"}
          </Text>
        </Pressable>

        {(error || status) && (
          <View className="mt-4 px-2">
            {error ? (
              <Text className="text-sm text-red-500">{error}</Text>
            ) : null}
            {status ? (
              <Text className="text-xs text-neutral-500 mt-1">{status}</Text>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
