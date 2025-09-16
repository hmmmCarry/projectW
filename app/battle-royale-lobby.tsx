import NavHeader from "@/components/NavHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BattleRoyaleLobby() {
  const router = useRouter();
  return (
    <SafeAreaView>
      <View className="bg-gray-100 px-4">
        <NavHeader />

        <View className="flex-row items-center space-x-3 justify-start px-4 mt-4">
          <MaterialCommunityIcons name="sword-cross" size={24} color="black" />
          <Text className="text-2xl font-bold">Battle Royale</Text>
        </View>

        <View className="flex-row gap-2 w-full ">
          <TextInput
            className="w-3/4 bg-gray-300 rounded-lg p-2 mt-4 h-16"
            placeholder="Enter code to join game room"
            placeholderTextColor={"black"}
          />
          <Pressable
            onPress={() => router.push("/duel-game-start")}
            className="w-1/4 bg-fuchsia-400 rounded-lg p-2 mt-4 h-16 items-center justify-center"
          >
            <Text className="text-white font-bold">Join Game</Text>
          </Pressable>
        </View>

        <View className="bg-gray-200 h-1 mt-4"></View>

        <Pressable
          onPress={() => router.push("/create")}
          className="bg-fuchsia-400 rounded-lg mt-4 h-16 items-center justify-center mx-4"
        >
          <Text className="text-white font-bold">Create Room</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
