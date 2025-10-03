import { useTheme } from "@/providers/ThemeProvider";
import { normalizeGuessStates } from "@/utils/normalizeGuess";
import { useMemo } from "react";
import { Image, Pressable, Text, View, ViewStyle } from "react-native";
import MicroProgressGrid from "./micro-progress-grid";

export type PlayerPillGuessStateInput =
  | "correct"
  | "present"
  | "absent"
  | "tbd"
  | "empty"
  | "idle"
  | "green"
  | "yellow"
  | "gray"
  | null
  | undefined;
type GuessState = "correct" | "present" | "absent" | "idle";

type PlayerPillProps = {
  name: string;
  avatar?: string;
  avatarUri?: string;
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
  guessPatterns?: PlayerPillGuessStateInput[][];
  tone?: "light" | "dark";
  style?: ViewStyle;
};

const LIGHT_COLORS = {
  base: {
    background: "#F6F6FE",
    border: "rgba(0,0,0,0.08)",
    text: "#111827",
    meta: "#6B7280",
    badgeBorder: "#F6F6FE",
  },
  active: {
    background: "#E0E7FF",
    border: "#6366F1",
    text: "#312E81",
    meta: "#4C1D95",
    badgeBorder: "#E0E7FF",
  },
} as const;

const DARK_COLORS = {
  base: {
    background: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.16)",
    text: "#E2E8F0",
    meta: "#CBD5F5",
    badgeBorder: "rgba(255,255,255,0.08)",
  },
  active: {
    background: "rgba(99,102,241,0.28)",
    border: "#6366F1",
    text: "#EEF2FF",
    meta: "#C7D2FE",
    badgeBorder: "rgba(99,102,241,0.28)",
  },
} as const;

export default function PlayerPill({
  name,
  avatar,
  avatarUri,
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
  tone,
  style,
}: PlayerPillProps) {
  const theme = useTheme();
  const totalCells = gridRows * gridCols;
  const palette = useMemo(() => {
    const baseTone = tone ?? (theme.mode === "dark" ? "dark" : "light");
    const colors = baseTone === "light" ? DARK_COLORS : LIGHT_COLORS;
    return active ? colors.active : colors.base;
  }, [active, theme.mode, tone]);

  const sanitizedPatterns = useMemo(() => {
    if (!showProgressGrid || !guessPatterns?.length) return undefined;
    return guessPatterns.map((row) =>
      Array.from({ length: gridCols }, (_, idx) => {
        const state = row?.[idx];
        if (state === "correct" || state === "present" || state === "absent") {
          return state as GuessState;
        }
        if (state === "green" || state === "yellow" || state === "gray") {
          const normalized = normalizeGuessStates([state]);
          return normalized[0] as GuessState;
        }
        return "idle" as GuessState;
      }),
    );
  }, [guessPatterns, gridCols, showProgressGrid]);

  const fallbackFilled = useMemo(() => {
    if (sanitizedPatterns) return 0;
    if (!showProgressGrid) return 0;
    const clampedGuesses = Math.max(0, Math.min(maxGuesses, guessesCount));
    return Math.max(0, Math.min(totalCells, clampedGuesses * gridCols));
  }, [guessesCount, maxGuesses, showProgressGrid, totalCells, sanitizedPatterns, gridCols]);

  const Wrapper = onPress ? Pressable : View;
  const avatarLabel = avatar || (name ? name.trim().charAt(0).toUpperCase() : "?");
  const gridProps = sanitizedPatterns ? { patterns: sanitizedPatterns } : { filled: fallbackFilled };
  const gridTone = tone ?? (active ? "dark" : undefined);

  return (
    <Wrapper
      onPress={onPress}
      disabled={!onPress}
      style={[
        {
          borderRadius: 28,
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderWidth: 1,
          paddingHorizontal: 8,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        style,
      ]}
    >
      {/* Avatar with online indicator */}
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: active ? "rgba(255,255,255,0.28)" : "white",
            borderWidth: 1,
            borderColor: active ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: 44, height: 44 }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 18, fontWeight: "600", color: palette.text }}>{avatarLabel}</Text>
          )}
        </View>
        {online && (
          <View
            style={{
              position: "absolute",
              right: -1,
              bottom: -1,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#34D399",
              borderWidth: 2,
              borderColor: palette.background,
            }}
          />
        )}
      </View>

      {/* Micro Progress Grid - Compact Design */}
      {showProgressGrid && (
        <MicroProgressGrid
          rows={gridRows}
          cols={gridCols}
          size={8}
          gap={2}
          radius={2}
          tone={gridTone}
          {...gridProps}
        />
      )}

      {/* Name and Stats - Compact Layout */}
      
        {/* <View style={{ flexDirection: "column",alignItems: "center", gap: 6,justifyContent: "center",paddingVertical: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ 
              color: palette.meta, 
              fontWeight: "800", 
              fontSize: 16,
            }}>
             🏆
            </Text>
            <Text style={{ 
              color: palette.text, 
              fontWeight: "800", 
              fontSize: 16,
            }}>
              {wins}
            </Text>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ 
              fontSize: 18,
            
            }}>
              🔥
            </Text>
            <Text style={{ 
              color: palette.text, 
              fontWeight: "800", 
              fontSize: 16,
            }}>
              {streak}
            </Text>
          </View>
        </View> */}
        <View style={{ flexDirection: "column", gap: 8 }}>
  {/* Wins Badge */}
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      shadowColor: theme.mode === "dark" ? "#000" : "#999",
      shadowOpacity: 0.25,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2, // Android shadow
    }}
  >
    <Text style={{ fontSize: 16, marginRight: 4 }}>🏆</Text>
    <Text
      style={{
        fontSize: 16,
        fontWeight: "800",
        color: palette.text,
        textShadowColor: theme.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }}
    >
      {wins}
    </Text>
  </View>

  {/* Streak Badge */}
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      shadowColor: theme.mode === "dark" ? "#000" : "#999",
      shadowOpacity: 0.25,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    }}
  >
    <Text style={{ fontSize: 16, marginRight: 4 }}>🔥</Text>
    <Text
      style={{
        fontSize: 16,
        fontWeight: "800",
        color: palette.text,
        textShadowColor: theme.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }}
    >
      {streak}
    </Text>
  </View>
</View>

    </Wrapper>
  );
}
