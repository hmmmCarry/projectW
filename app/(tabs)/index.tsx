import { getSocket } from "@/lib/socket";
import { useTheme } from "@/providers/ThemeProvider";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../globals.css";

export default function Index() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);
  const theme = useTheme();
  const { colors } = theme;

  const handleDevQuickDuel = () => {
    if (!__DEV__) return;
    const name = "Dev";
    if (!socket.connected) socket.connect();
    socket.emit(
      "createRoom",
      { name, mode: "duel" },
      (res?: { roomId?: string; error?: string }) => {
        if (res?.roomId) {
          router.push({
            pathname: "/duel-game-start",
            params: { roomId: res.roomId, name, host: "1" },
          });
        } else {
          console.warn(res?.error || "Could not create room.");
        }
      }
    );
  };
  return (
    <SafeAreaView className="flex-1">
      <View style={{ paddingHorizontal: 8, justifyContent: "center", backgroundColor: colors.background, marginTop: 16 }}>
        <View className="flex flex-row items-center justify-between w-full px-4 mb-2">
          <View className="">
            <Text className="text-[24px]">Hello there!</Text>
            <Text className="text-[32px] font-bold">Username</Text>
          </View>
          <View className="flex-row gap-2 items-center">
            <Ionicons name="person-circle-outline" size={24} color="black" />
            <Feather name="sun" size={24} color="black" />
          </View>
        </View>

        <View className="w-full px-4 h-1 bg-gray-200"></View>

        <View className="flex-row items-center space-x-3 justify-start px-4 mt-2">
          <MaterialCommunityIcons name="sword-cross" size={24} color="black" />
          <Text className="text-2xl font-bold">Duel (1x1)</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="w-full px-4 space-x-4"
          contentContainerStyle={{ gap: 10 }}
        >
          <Pressable onPress={() => router.push("/duel")}>
            <View className="h-32 w-52 bg-gray-400 rounded-lg mt-4"></View>
          </Pressable>
          <View className="h-32 w-52 bg-gray-400 rounded-lg mt-4"></View>
        </ScrollView>

        {__DEV__ ? (
          <View className="px-4 mt-3">
            <Pressable
              onPress={handleDevQuickDuel}
              className="bg-fuchsia-500 rounded-lg h-12 items-center justify-center"
            >
              <Text className="text-white font-bold">Quick Duel (Dev)</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center space-x-3 justify-start px-4 mt-2">
          <MaterialCommunityIcons name="crown" size={24} color="black" />
          <Text className="text-2xl font-bold">
            Battle Royale (Multiplayer)
          </Text>
        </View>

        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          className="w-full px-4 space-x-4"
          contentContainerStyle={{ gap: 10 }}
        >
          <Pressable onPress={() => router.push("/battle-royale-lobby")}>
            <View className="h-32 w-52 bg-gray-400 rounded-lg mt-4"></View>
          </Pressable>
          <View className="h-32 w-52 bg-gray-400 rounded-lg mt-4"></View>
        </ScrollView>

        <View className="flex-row space-x-3 justify-start px-4 mt-4">
          <Text className="text-2xl font-bold">How to play</Text>
        </View>

        <View className="w-full px-4">
          <View className="h-48 w-full bg-gray-400 rounded-lg mt-4"></View>
        </View>
      </View>
    </SafeAreaView>
  );
}
