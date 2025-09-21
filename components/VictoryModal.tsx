import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRematch: () => void;

  winnerName: string;         // "TipsyPreacher"
  winnerInitials?: string;    // small text under avatar: "TP"
  winnerEmoji?: string;       // big emoji inside avatar (e.g. "🧪")
  isMeWinner?: boolean;       // you can style the title differently if you want

  correctWord: string;        // "SHARE"
};

export default function VictoryModal({
  visible,
  onClose,
  onRematch,
  winnerName,
  winnerInitials = "TP",
  winnerEmoji = "🧪",
  isMeWinner = false,
  correctWord = "",
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.95);
    }
  }, [visible]);

  const letters = (correctWord || "")
    .toUpperCase()
    .padEnd(5, " ")
    .slice(0, 5)
    .split("");

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      {/* Dim overlay */}
      <Animated.View
        className="flex-1 bg-black/50 items-center justify-center px-6"
        style={{ opacity: fade }}
      >
        {/* Dialog */}
        <Animated.View
          className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6"
          style={{
            transform: [{ scale }],
            // subtle elevation
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          {/* Close */}
          <Pressable
            accessibilityLabel="Close"
            onPress={onClose}
            className="absolute right-3 top-3 w-8 h-8 rounded-full items-center justify-center bg-black/5 dark:bg-white/10"
          >
            <Ionicons name="close" size={18} color="#333" />
          </Pressable>

          {/* Avatar + crown */}
          <View className="items-center mb-4 mt-2">
            <View className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/10 items-center justify-center relative">
              <Text style={{ fontSize: 28 }}>{winnerEmoji}</Text>
              <View className="absolute -right-2 -top-2">
                <FontAwesome5 name="crown" size={16} color="#F59E0B" />
              </View>
              <View className="absolute -bottom-2 self-center px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
                <Text className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-200">
                  {winnerInitials}
                </Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <Text className="text-center text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 mt-3">
            {winnerName} won!
          </Text>
          <Text className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            The word was
          </Text>

          {/* Word tiles */}
          <View className="flex-row items-center justify-center gap-2 mt-3 mb-5">
            {letters.map((ch, i) => (
              <View
                key={i}
                className="w-11 h-12 rounded-lg items-center justify-center border"
                style={{
                  backgroundColor: "#22c55e", // green-500
                  borderColor: "#22c55e",
                }}
              >
                <Text className="text-white font-extrabold text-lg">
                  {ch.trim()}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={onRematch}
            className="h-12 rounded-full bg-neutral-900 dark:bg-neutral-100 items-center justify-center"
          >
            <Text className="text-white dark:text-neutral-900 font-semibold">
              Rematch
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
