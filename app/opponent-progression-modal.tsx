import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Tile = "correct" | "present" | "absent" | "idle";
type GuessRow = Tile[]; // length 5 ideally

function OpponentProgressModal({
  visible,
  onClose,
  recent = [],
}: {
  visible: boolean;
  onClose: () => void;
  recent?: GuessRow[]; // pass up to last 3–6 rows later
}) {
  const color = (t: Tile) =>
    t === "correct"
      ? "bg-[#6aaa64]"
      : t === "present"
      ? "bg-[#c9b458]"
      : t === "absent"
      ? "bg-[#3a3a3c]"
      : "bg-neutral-700/60";

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
      <View className="mx-6 mt-[30%] rounded-2xl bg-neutral-900 p-5 border border-white/10">
        <Text className="text-neutral-200 font-semibold mb-3">
          Opponent Progress
        </Text>

        {/* grid */}
        <View className="gap-2">
          {recent.map((row, i) => (
            <View key={i} className="flex-row gap-2">
              {row.map((t, j) => (
                <View
                  key={j}
                  className={`w-8 h-8 rounded-md border border-white/10 ${color(t)} items-center justify-center`}
                />
              ))}
            </View>
          ))}
          {recent.length === 0 && (
            <Text className="text-neutral-400 text-sm">No guesses yet.</Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          className="self-end mt-4 px-4 py-2 rounded-lg bg-white/10"
        >
          <Text className="text-neutral-100">Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

export default OpponentProgressModal;
