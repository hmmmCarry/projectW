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
    { code: "Q" }, { code: "W" }, { code: "E" }, { code: "R" }, { code: "T" },
    { code: "Y" }, { code: "U" }, { code: "I" }, { code: "O" }, { code: "P" },
  ],
  [
    { code: "A" }, { code: "S" }, { code: "D" }, { code: "F" }, { code: "G" },
    { code: "H" }, { code: "J" }, { code: "K" }, { code: "L" },
  ],
  [
    { code: "ENTER", flex: 1.4 },
    { code: "Z" }, { code: "X" }, { code: "C" }, { code: "V" },
    { code: "B" }, { code: "N" }, { code: "M" },
    { code: "BACKSPACE", flex: 1.4 },
  ],
];

const KEY_LABEL: Record<string, string> = {
  ENTER: "ENTER",
  BACKSPACE: "DEL",
};

const PALETTE = {
  light: {
    boardBg: "#F4F6F9",
    keyBg: "#e5e7eb",
    keyText: "#34495E",
    enterReady: "#00C2A8",
    enterDisabled: "#d1d5db",
    backspace: "#FF6B6B",
  },
  dark: {
    boardBg: "#000000",
    keyBg: "#1f2937",
    keyText: "#e5e7eb",
    enterReady: "#00C2A8",
    enterDisabled: "#374151",
    backspace: "#FF6B6B",
  },
};

function getKeyBackground(code: string, enterStatus: EnterStatus, mode: "light" | "dark") {
  const palette = PALETTE[mode];
  if (code === "ENTER") {
    if (enterStatus === "ready") return palette.enterReady;
    if (enterStatus === "disabled") return palette.enterDisabled;
    return palette.keyBg;
  }
  if (code === "BACKSPACE") return palette.backspace;
  return palette.keyBg;
}

function getKeyForeground(code: string, enterStatus: EnterStatus, mode: "light" | "dark") {
  const palette = PALETTE[mode];
  if (code === "ENTER") return enterStatus === "disabled" ? "#6b7280" : "#fff";
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
  const { colors, wordle } = theme;

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
        backgroundColor: colors.surface,
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
            let background = colors.neutral;
            let foreground = colors.text;

            if (state) {
              if (state === "correct") {
                background = wordle.correct;
                foreground = "#fff";
              } else if (state === "present") {
                background = wordle.present;
                foreground = "#fff";
              } else if (state === "absent") {
                background = wordle.absent;
                foreground = "#fff";
              }
            }

            if (key.code === "ENTER") {
              background =
                enterStatus === "ready"
                  ? colors.accent
                  : enterStatus === "disabled"
                  ? colors.neutral
                  : colors.surfaceElevated;
              foreground = colors.textOnAccent;
            } else if (key.code === "BACKSPACE") {
              background = "#FF6B6B"; // coral
              foreground = "#fff";
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
                  backgroundColor: background,
                  minHeight: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: key.code === "ENTER" || key.code === "BACKSPACE" ? 8 : 0,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: foreground,
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

