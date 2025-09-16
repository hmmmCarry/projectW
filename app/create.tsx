import { Entypo, Feather, Fontisto } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Create() {
  return (
    <SafeAreaView>
      <View className="min-h-full bg-gray-100 mt-4 px-4">
        <View className="flex flex-row items-center w-full px-4">
          <View className="flex-row space-x-4 justify-end w-full">
            <Fontisto name="person" size={24} color="black" />
            <Feather name="sun" size={24} color="black" />
          </View>
        </View>

        <View className="space-x-3 justify-start px-4">
          <Text className="text-2xl font-bold">Create a game room</Text>
          <Text className="text-md font-bold">
            Tip: Share the room code with friends to play together
          </Text>
        </View>

        <View className="flex-row gap-2 w-full ">
          <TextInput
            className="w-3/4 bg-gray-300 rounded-lg p-2 mt-4 h-16"
            placeholder="ABCD1234"
            placeholderTextColor={"black"}
          />
          <Pressable
            onPress={() => alert("Code has been copied to clipboard!")}
            className="w-1/4 bg-fuchsia-400 rounded-lg p-2 mt-4 h-16 items-center justify-center"
          >
            <Feather name="copy" size={24} color="white" />
          </Pressable>
        </View>

        <Text className="text-lg font-semibold mt-4">
          Enter a word to start the game or press the die to generate a word
        </Text>

        <View className="flex-row gap-2 w-full ">
          <TextInput
            className="w-3/4 bg-gray-300 rounded-lg p-2 mt-4 h-16"
            placeholder="BREAD"
            placeholderTextColor={"black"}
          />
          <Pressable
            onPress={() => router.push("/game-start")}
            className="w-1/4 bg-fuchsia-400 rounded-lg p-2 mt-4 h-16 items-center justify-center"
          >
            <Entypo name="controller-play" size={24} color="white" />
          </Pressable>
        </View>

        <Text className="text-red-400 mt-4 font font-semibold">
          WAIT FOR YOUR FRIENDS TO JOIN BEFORE YOU START THE GAME
        </Text>

        <View className="bg-gray-200 h-1 mt-4"></View>
        <View className="flex-row justify-between">
          <Text className="text-lg font-semibold mt-4">PLAYERS</Text>
          <Text className="text-lg font-semibold mt-4">0/6 ONLINE</Text>
        </View>
        <View className="w-full border-t-2 border-gray-400 mt-4">
          <View className="flex-row w-full mt-1 items-center gap-10">
            <Fontisto name="person" size={24} color="black" />
            <Text className="text-lg ">Username</Text>
            <Text className="text-lg ">STAT 1</Text>
            <Text className="text-lg ">STAT 2</Text>
            <Text className="text-lg ">STAT 3</Text>
          </View>
        </View>
        <View className="w-full border-t-2 border-gray-400 mt-4">
          <View className="flex-row w-full mt-1 items-center gap-10">
            <Fontisto name="person" size={24} color="black" />
            <Text className="text-lg ">Username</Text>
            <Text className="text-lg ">STAT 1</Text>
            <Text className="text-lg ">STAT 2</Text>
            <Text className="text-lg ">STAT 3</Text>
          </View>
        </View>
        <View className="w-full border-t-2 border-gray-400 mt-4">
          <View className="flex-row w-full mt-1 items-center gap-10">
            <Fontisto name="person" size={24} color="black" />
            <Text className="text-lg ">Username</Text>
            <Text className="text-lg ">STAT 1</Text>
            <Text className="text-lg ">STAT 2</Text>
            <Text className="text-lg ">STAT 3</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
