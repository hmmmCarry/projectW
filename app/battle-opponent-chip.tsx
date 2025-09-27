import React, { useMemo } from "react";
import { Image, Pressable, Text, View, ViewStyle } from "react-native";
import MicroProgressGrid from "./micro-progress-grid";

export type BattleChipPlayer = {
  id: string;
  name: string;
  avatarEmoji?: string;
  avatarUri?: string;
  wins?: number;
  streak?: number;
  guesses?: number;
  online?: boolean;
};

type Props = {
  player: BattleChipPlayer;
  style?: ViewStyle;
  tone?: "light" | "dark";
  active?: boolean;
  onPress?: () => void;
};

export default function BattleOpponentChip({ player, style, tone = "light", active = false, onPress }: Props) {
  const gCount = Math.max(0, Math.min(6, player.guesses ?? 0));
  const filled = gCount * 5;

  const colors = useMemo(() => {
    const baseBg = tone === "dark" ? "rgba(255,255,255,0.08)" : "#F6F6FE";
    const baseBorder = tone === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)";
    const baseText = tone === "dark" ? "#E2E8F0" : "#111827";
    const baseMeta = tone === "dark" ? "#CBD5F5" : "#6B7280";

    if (!active) {
      return {
        background: baseBg,
        border: baseBorder,
        text: baseText,
        meta: baseMeta,
        badgeBorder: baseBg,
      };
    }

    return {
      background: tone === "dark" ? "rgba(99,102,241,0.28)" : "#E0E7FF",
      border: "#6366F1",
      text: tone === "dark" ? "#EEF2FF" : "#312E81",
      meta: tone === "dark" ? "#C7D2FE" : "#4C1D95",
      badgeBorder: tone === "dark" ? "rgba(99,102,241,0.28)" : "#E0E7FF",
    };
  }, [active, tone]);

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      className="flex-row items-center rounded-3xl"
      style={[
        {
          backgroundColor: colors.background,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: active ? "rgba(255,255,255,0.28)" : "white",
          borderWidth: 1,
          borderColor: active ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.08)",
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
          <Text style={{ fontSize: 18, color: colors.text }}>
            {(player.avatarEmoji || "?").slice(0, 2)}
          </Text>
        )}

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
            borderColor: colors.badgeBorder,
          }}
        />
      </View>

      <View style={{ flex: 1, marginRight: 10 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.meta }}>
          W:{player.wins ?? 0}  STREAK:{player.streak ?? 0}
        </Text>
      </View>

      <MicroProgressGrid
        rows={4}
        cols={5}
        size={11}
        gap={2}
        radius={4}
        filled={filled}
        tone={active ? "dark" : tone}
      />
    </Wrapper>
  );
}
