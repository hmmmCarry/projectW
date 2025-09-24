import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type EnterStatus = "default" | "ready" | "disabled";

type Props = {
  onKeyPress: (key: string) => void;
  enterStatus?: EnterStatus;
  disabled?: boolean;
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

function getKeyBackground(code: string, enterStatus: EnterStatus, mode: "light" | "dark") {
  if (code === "ENTER") {
    if (enterStatus === "ready") return mode === "dark" ? "#6366f1" : "#4338ca";
    if (enterStatus === "disabled") return mode === "dark" ? "#374151" : "#d1d5db";
    return mode === "dark" ? "#111827" : "#111827";
  }
  if (code === "BACKSPACE") {
    return mode === "dark" ? "#374151" : "#4b5563";
  }
  return mode === "dark" ? "#1f2937" : "#e5e7eb";
}

function getKeyForeground(code: string, enterStatus: EnterStatus, mode: "light" | "dark") {
  if (code === "ENTER") {
    if (enterStatus === "disabled") return mode === "dark" ? "#6b7280" : "#6b7280";
    return "#fff";
  }
  if (code === "BACKSPACE") return "#fff";
  return mode === "dark" ? "#e5e7eb" : "#111827";
}

export default function GameKeyboard({
  onKeyPress,
  enterStatus = "default",
  disabled = false,
}: Props) {
  const theme = useTheme();
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
        backgroundColor: theme.mode === "dark" ? "#111827" : "#f4f4f5",
      }}
    >
      {KEY_LAYOUT.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{ flexDirection: "row", justifyContent: "center", marginBottom: rowIndex === KEY_LAYOUT.length - 1 ? 0 : 10 }}
        >
          {row.map((key) => {
            const background = getKeyBackground(key.code, enterStatus, theme.mode);
            const foreground = getKeyForeground(key.code, enterStatus, theme.mode);
            const isEnter = key.code === "ENTER";
            const isBackspace = key.code === "BACKSPACE";
            const flex = key.flex ?? 1;

            return (
              <TouchableOpacity
                key={key.code}
                onPress={() => handlePress(key.code)}
                activeOpacity={0.85}
                disabled={disabled || (key.code === "ENTER" && enterStatus === "disabled")}
                style={{
                  flex,
                  marginHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: background,
                  minHeight: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: isEnter || isBackspace ? 8 : 0,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <Text style={{ color: foreground, fontWeight: "700", fontSize: 16 }}>
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
