import { useTheme } from "@/providers/ThemeProvider";
import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type EnterStatus = "default" | "ready" | "disabled";

type Props = {
  onKeyPress: (key: string) => void;
  enterStatus?: EnterStatus;
  disabled?: boolean;
  letterStates?: Record<string, "correct" | "present" | "absent">;
  height?: number;
  className?: string;
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
    { code: "ENTER", flex: 1.5 },
    { code: "Z" }, { code: "X" }, { code: "C" }, { code: "V" },
    { code: "B" }, { code: "N" }, { code: "M" },
    { code: "BACKSPACE", flex: 1.5 },
  ],
];


const KEY_LABEL: Record<string, string> = {
  ENTER: "ENTER",
  BACKSPACE: "⌫",
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
  height = 260,
  className = "",
}: Props) {
  const theme = useTheme();
  const { colors, wordle } = theme;
  const [containerWidth, setContainerWidth] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // layout constants
  const horizontalPadding = 12; // container left/right padding
  const verticalPadding = 12 + 20; // top + bottom from component styles below
  const keyGap = 6; // horizontal gap between keys (reduced for better spacing)
  const rowGap = 8; // vertical gap between rows (reduced for better spacing)
  const borderRadius = 8; // reduced for modern look

  const rowHeight = useMemo(() => {
    const rows = KEY_LAYOUT.length;
    const available = height - verticalPadding - rowGap * (rows - 1);
    return Math.max(40, Math.floor(available / rows));
  }, [height]);

  const handlePress = (code: string) => {
    if (disabled) return;
    if (code === "ENTER" && enterStatus === "disabled") return;
    setPressedKey(code);
    onKeyPress(code);
    setTimeout(() => setPressedKey(null), 100);
  };

  return (
    <View
      style={{
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: colors.surface,
        height,
      }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== containerWidth) setContainerWidth(w);
      }}
    >
      {KEY_LAYOUT.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: rowIndex === KEY_LAYOUT.length - 1 ? 0 : rowGap,
            paddingHorizontal: horizontalPadding,
          }}
        >
          {row.map((key, colIndex) => {
            const state = letterStates?.[key.code];
            let background = colors.neutral;
            let foreground = colors.text;
            const totalFlex = row.reduce((sum, k) => sum + (k.flex ?? 1), 0);
// compute uniform width per key for this row
const keysInRow = row.length;
const availableWidth = Math.max(
  0,
  containerWidth - horizontalPadding * 2 - keyGap * (keysInRow - 1),
);
            const unitWidth = availableWidth / totalFlex;

            const keyWidth = (key.flex ?? 1) * unitWidth;
            const isSecondRow = rowIndex === 1;
            const extraMargin = isSecondRow && colIndex === 0 ? keyWidth * 0.5 : 0;

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

            
            

            const isPressed = pressedKey === key.code;
            const isDisabled = disabled || (key.code === "ENTER" && enterStatus === "disabled");

            return (
              <TouchableOpacity
                key={key.code}
                onPress={() => handlePress(key.code)}
                activeOpacity={0.85}
                disabled={isDisabled}
                style={{
                  width: keyWidth,
                  height: rowHeight,
                  marginLeft: extraMargin, // shift row 2
                  marginRight: colIndex === row.length - 1 ? 0 : keyGap,
                  borderRadius,
                  backgroundColor: background,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isDisabled ? 0.5 : 1,
                  transform: [{ scale: isPressed ? 0.95 : 1 }],
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    color: foreground,
                    fontWeight: "700",
                    fontSize: key.code === "ENTER" ? 12 : 16,
                    textAlign: "center",
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

