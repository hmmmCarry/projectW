import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// Keyboard layout rows
const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

// Example colors: green (correct), yellow (present), gray (wrong)
const keyColors = {
  A: "bg-green-700/70",
  S: "bg-green-700/70",
  D: "bg-green-700/70",
  E: "bg-green-700/70",
  I: "bg-green-700/70",
  N: "bg-green-700/70",
  B: "bg-green-700/70",
  W: "bg-gray-500",
  Y: "bg-gray-500",
  F: "bg-gray-500",
  U: "bg-gray-500",
};

export default function GameKeyboard({ onKeyPress }: { onKeyPress: any }) {
  return (
    <View className="p-3 items-center justify-center">
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row mb-1">
          {row.map((key) => {
            const bgClass = keyColors[key] || "bg-gray-300";
            return (
              <TouchableOpacity
                key={key}
                className={`m-1 px-3 py-4 rounded ${bgClass}`}
                onPress={() => onKeyPress(key)}
              >
                <Text className="text-white font-bold text-base">{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
