// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import React from "react";
// import { Pressable, Text, View } from "react-native";

// type PlayerPillProps = {
//   name: string;
//   avatar?: string;            // emoji or single letter
//   wins?: number;
//   streak?: number;
//   isHost?: boolean;
//   connected?: boolean;        // online indicator
//   onPressProgress?: () => void; // grid button handler
//   className?: string;         // extra Tailwind classes if you need
// };

// export function PlayerPill({
//   name,
//   avatar = "😊",
//   wins = 0,
//   streak = 0,
//   isHost = false,
//   connected = true,
//   onPressProgress,
//   className = "",
// }: PlayerPillProps) {
//   return (
//     <View
//       className={`mx-4 rounded-2xl bg-neutral-900 border border-white/10 px-3 py-2 flex-row items-center ${className}`}
//     >
//       {/* Connection dot */}
//       <View className="mr-2">
//         <View
//           className={`w-2.5 h-2.5 rounded-full ${
//             connected ? "bg-emerald-400" : "bg-neutral-500"
//           }`}
//         />
//       </View>

//       {/* Avatar */}
//       <View className="w-9 h-9 rounded-full bg-purple-600/20 items-center justify-center mr-2">
//         <Text className="text-purple-300 font-semibold">{avatar}</Text>
//       </View>

//       {/* Name & stats */}
//       <View className="flex-1 min-w-0">
//         <View className="flex-row items-center gap-1">
//           <Text
//             numberOfLines={1}
//             className="text-neutral-100 font-semibold"
//           >
//             {name}
//           </Text>

//           {isHost && (
//             <MaterialCommunityIcons
//               name="crown-outline"
//               size={14}
//               color="#f5c052"
//             />
//           )}
//         </View>

//         <Text className="text-xs text-neutral-400">
//           W:{wins}   STREAK:{streak}
//         </Text>
//       </View>

//       {/* Opponent progress (mini-board) button */}
//       <Pressable
//         onPress={onPressProgress}
//         className="w-9 h-9 rounded-xl bg-white/5 items-center justify-center active:opacity-80"
//         accessibilityRole="button"
//         accessibilityLabel="Show progress"
//       >
//         <Ionicons name="grid-outline" size={18} color="#cdd0d5" />
//       </Pressable>
//     </View>
//   );
// }

import React, { useMemo } from "react";
import { Text, View } from "react-native";
import MicroProgressGrid from "./micro-progress-grid";

type PlayerPillProps = {
  name: string;
  avatar?: string;             // emoji or char
  wins?: number;
  streak?: number;
  online?: boolean;
  // Progress source (e.g., number of guesses made)
  guessesCount?: number;       // 0..6 for Wordle
  maxGuesses?: number;         // default 6
  // Grid config (kept 4x4 to match your mock)
  gridRows?: number;
  gridCols?: number;
};

export function PlayerPill({
  name,
  avatar = "😊",
  wins = 0,
  streak = 0,
  online = true,
  guessesCount = 0,
  maxGuesses = 6,
  gridRows = 3,
  gridCols = 5,
}: PlayerPillProps) {
  // map 0..maxGuesses onto 0..(rows*cols)
  const totalCells = gridRows * gridCols;
  const filled = useMemo(() => {
    const ratio = Math.max(0, Math.min(1, guessesCount / maxGuesses));
    return Math.round(ratio * totalCells);
  }, [guessesCount, maxGuesses, totalCells]);

  return (
    <View
      style={{
        marginHorizontal: 16,
        borderRadius: 24,
        backgroundColor: "#F6F6FE",
        borderColor: "rgba(0,0,0,0.08)",
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Avatar + online dot */}
      <View style={{ marginRight: 8 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>{avatar}</Text>
        </View>
        {/* online dot anchored to bottom-left like your mock */}
        <View
          style={{
            position: "absolute",
            left: -2,
            bottom: -2,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: online ? "#22c55e" : "rgba(0,0,0,0.2)",
            borderWidth: 2,
            borderColor: "#F6F6FE",
          }}
        />
      </View>

      {/* Name + stats */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: "#111827",
            fontWeight: "600",
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            color: "rgba(17,24,39,0.65)",
            fontWeight: "700",
            fontSize: 12,
            letterSpacing: 0.2,
          }}
        >
          W:{wins}  STREAK:{streak}
        </Text>
      </View>

      {/* Real progress grid*/}
      <MicroProgressGrid rows={gridRows} cols={gridCols} filled={7} gap={1}  // the rounded frame padding
/>
    </View>
  );
}
