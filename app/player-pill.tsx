import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import MicroProgressGrid from "./micro-progress-grid";

type GuessStateInput = "correct" | "present" | "absent" | "tbd" | "empty" | "idle" | null | undefined;
type GuessState = "correct" | "present" | "absent" | "idle";

type PlayerPillProps = {
  name: string;
  avatar?: string;
  wins?: number;
  streak?: number;
  online?: boolean;
  guessesCount?: number;
  maxGuesses?: number;
  gridRows?: number;
  gridCols?: number;
  onPress?: () => void;
  active?: boolean;
  showProgressGrid?: boolean;
  guessPatterns?: GuessStateInput[][];
};

export default function PlayerPill({
  name,
  avatar = "?",
  wins = 0,
  streak = 0,
  online = true,
  guessesCount = 0,
  maxGuesses = 6,
  gridRows = 3,
  gridCols = 5,
  onPress,
  active = false,
  showProgressGrid = true,
  guessPatterns,
}: PlayerPillProps) {
  const totalCells = gridRows * gridCols;

  const sanitizedPatterns = useMemo(() => {
    if (!showProgressGrid || !guessPatterns?.length) return undefined;
    return guessPatterns.map((row) => {
      return Array.from({ length: gridCols }, (_, idx) => {
        const state = row?.[idx];
        if (state === "correct" || state === "present" || state === "absent") {
          return state as GuessState;
        }
        return "idle" as GuessState;
      });
    });
  }, [guessPatterns, gridCols, showProgressGrid]);

  const fallbackFilled = useMemo(() => {
    if (sanitizedPatterns) return 0;
    if (!showProgressGrid) return 0;
    const safeMax = Math.max(1, maxGuesses);
    const ratio = Math.max(0, Math.min(1, guessesCount / safeMax));
    return Math.round(ratio * totalCells);
  }, [guessesCount, maxGuesses, showProgressGrid, totalCells, sanitizedPatterns]);

  const containerBg = active ? "#312e81" : "#F6F6FE";
  const containerBorder = active ? "rgba(49,46,129,0.7)" : "rgba(0,0,0,0.08)";
  const textColor = active ? "#eef2ff" : "#111827";
  const metaColor = active ? "rgba(238,242,255,0.7)" : "rgba(17,24,39,0.65)";

  const Wrapper = onPress ? Pressable : View;

  const gridProps = sanitizedPatterns ? { patterns: sanitizedPatterns } : { filled: fallbackFilled };

  return (
    <Wrapper
      onPress={onPress}
      disabled={!onPress}
      style={{
        borderRadius: 24,
        backgroundColor: containerBg,
        borderColor: containerBorder,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        opacity: onPress ? 1 : 0.95,
      }}
    >
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: active ? "rgba(255,255,255,0.15)" : "white",
            borderWidth: 1,
            borderColor: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 20, color: textColor }}>{avatar}</Text>
        </View>
        <View
          style={{
            position: "absolute",
            left: -3,
            bottom: -3,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: online ? "#22c55e" : "rgba(0,0,0,0.25)",
            borderWidth: 2,
            borderColor: containerBg,
          }}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ color: textColor, fontWeight: "600", fontSize: 16 }}
        >
          {name}
        </Text>
        <Text
          style={{
            color: metaColor,
            fontWeight: "600",
            fontSize: 12,
            letterSpacing: 0.2,
          }}
        >
          W:{wins}  STREAK:{streak}
        </Text>
      </View>

      {showProgressGrid ? (
        <MicroProgressGrid
          rows={gridRows}
          cols={gridCols}
          gap={1}
          tone={active ? "dark" : "light"}
          radius={3}
          size={10}
          {...gridProps}
        />
      ) : null}
    </Wrapper>
  );
}
