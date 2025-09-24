import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type EnterStatus = "default" | "ready" | "disabled";

type Props = {
  onKeyPress: (key: string) => void;
  enterStatus?: EnterStatus;
  disabled?: boolean;
  letterStates?: Record<string, "correct" | "present" | "absent">;
};

type KeyDef = {
  code: string;
  flex?: number;
};

const KEY_LAYOUT: KeyDef[][] = [
  [
    { code: "Q" },
    { code: "W" },
    { code: "E" },
    { code: "R" },
    { code: "T" },
    { code: "Y" },
    { code: "U" },
    { code: "I" },
    { code: "O" },
    { code: "P" },
  ],
  [
    { code: "A" },
    { code: "S" },
    { code: "D" },
    { code: "F" },
    { code: "G" },
    { code: "H" },
    { code: "J" },
    { code: "K" },
    { code: "L" },
  ],
  [
    { code: "ENTER", flex: 1.4 },
    { code: "Z" },
    { code: "X" },
    { code: "C" },
    { code: "V" },
    { code: "B" },
    { code: "N" },
    { code: "M" },
    { code: "BACKSPACE", flex: 1.4 },
  ],
];

const KEY_LABEL: Record<string, string> = {
  ENTER: "ENTER",
  BACKSPACE: "DEL",
};
const COLORS = {
  light: {
    boardBg: "#F4F6F9", // soft gray background
    keyBg: "#e5e7eb", // default key
    keyText: "#34495E", // charcoal
    enterReady: "#00C2A8", // teal
    enterDisabled: "#d1d5db", // gray
    backspace: "#FF6B6B", // coral highlight
    correct: "#99E66F", // lime
    present: "#00C2A8", // teal
    absent: "#34495E", // charcoal
  },
  dark: {
    boardBg: "#000000",
    keyBg: "#1f2937",
    keyText: "#e5e7eb",
    enterReady: "#00C2A8",
    enterDisabled: "#374151",
    backspace: "#FF6B6B",
    correct: "#99E66F",
    present: "#00C2A8",
    absent: "#34495E",
  },
};

function getKeyBackground(
  code: string,
  enterStatus: EnterStatus,
  mode: "light" | "dark"
) {
  const palette = COLORS[mode];
  if (code === "ENTER") {
    if (enterStatus === "ready") return palette.enterReady;
    if (enterStatus === "disabled") return palette.enterDisabled;
    return palette.keyBg;
  }
  if (code === "BACKSPACE") {
    return palette.backspace;
  }
  return palette.keyBg;
}

function getKeyForeground(
  code: string,
  enterStatus: EnterStatus,
  mode: "light" | "dark"
) {
  const palette = COLORS[mode];
  if (code === "ENTER") {
    if (enterStatus === "disabled") return "#6b7280";
    return "#fff";
  }
  if (code === "BACKSPACE") return "#fff";
  return palette.keyText;
}

export default function GameKeyboard({
  onKeyPress,
  enterStatus = "default",
  disabled = false,
  letterStates,
}: Props) {
  const theme = useTheme();
  const mode = theme?.mode === "dark" ? "dark" : "light"; // ✅ fallback
  const palette = COLORS[mode];

  const handlePress = (code: string) => {
    if (disabled) return;
    if (code === "ENTER" && enterStatus === "disabled") return;
    onKeyPress(code);
  };

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: palette.boardBg || "#fff", // ✅ safe fallback
      }}
    >
      {KEY_LAYOUT.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: rowIndex === KEY_LAYOUT.length - 1 ? 0 : 10,
          }}
        >
          {row.map((key) => {
            const state = letterStates?.[key.code];
            let background = getKeyBackground(key.code, enterStatus, mode);
            let foreground = getKeyForeground(key.code, enterStatus, mode);

            if (state && key.code !== "ENTER" && key.code !== "BACKSPACE") {
              if (state === "correct") {
                background = palette.correct || "#4ade80";
                foreground = "#fff";
              } else if (state === "present") {
                background = palette.present || "#22d3ee";
                foreground = "#fff";
              } else if (state === "absent") {
                background = palette.absent || "#334155";
                foreground = "#fff";
              }
            }

            return (
              <TouchableOpacity
                key={key.code}
                onPress={() => handlePress(key.code)}
                activeOpacity={0.85}
                disabled={disabled || (key.code === "ENTER" && enterStatus === "disabled")}
                style={{
                  flex: key.flex ?? 1,
                  marginHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: background || "#ccc", // ✅ no undefined
                  minHeight: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: key.code === "ENTER" || key.code === "BACKSPACE" ? 8 : 0,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: foreground || "#000", // ✅ safe fallback
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {KEY_LABEL[key.code] || key.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

