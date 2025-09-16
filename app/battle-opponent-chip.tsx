import React from "react";
import { Image, Text, View, ViewStyle } from "react-native";
import MicroProgressGrid from "./micro-progress-grid";

export type BattleChipPlayer = {
  id: string;
  name: string;
  avatarEmoji?: string;          // optional emoji
  avatarUri?: string;            // optional image
  wins?: number;
  streak?: number;
  guesses?: number;              // number of submitted guesses (0..6)
  online?: boolean;
};

type Props = {
  player: BattleChipPlayer;
  style?: ViewStyle;
  /** show neutral light card; no brand color yet */
  tone?: "light" | "dark";
};

export default function BattleOpponentChip({ player, style, tone = "light" }: Props) {
  const wins   = player.wins ?? 0;
  const streak = player.streak ?? 0;
  const gCount = Math.max(0, Math.min(6, player.guesses ?? 0));

  // each guess = 5 tiles worth of “progress” on the micro grid
  const filled = gCount * 5;

  return (
    <View
      className="flex-row items-center rounded-3xl"
      style={[
        {
          backgroundColor: "#F6F6FE",                  // soft plate
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
        },
        style,
      ]}
    >
      {/* Avatar / initials */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        {player.avatarUri ? (
          <Image
            source={{ uri: player.avatarUri }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 18 }}>{player.avatarEmoji ?? "🧩"}</Text>
        )}

        {/* online dot */}
        <View
          style={{
            position: "absolute",
            bottom: -2,
            left: -2,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: player.online ? "#34D399" : "rgba(0,0,0,0.15)",
            borderWidth: 2,
            borderColor: "#F6F6FE",
          }}
        />
      </View>

      {/* Micro progress grid – fixed size, right side */}
      <MicroProgressGrid
        rows={4}
        cols={5}
        size={11}
        gap={2}
        radius={4}
        filled={filled}
        tone={tone}
      />
    </View>
  );
}
