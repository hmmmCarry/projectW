import { useTheme } from "@/providers/ThemeProvider";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";

type TileState = "empty" | "correct" | "present" | "absent" | "tbd";
type GuessRow = {
  letters: string;
  states?: TileState[];
};

type Props = {
  guesses?: GuessRow[];
  rowCount?: number;
  columnCount?: number;
  tone?: "light" | "dark";
  framed?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  gap?: number;
  style?: ViewStyle;
};

const DEFAULT_ROWS = 6;
const DEFAULT_COLUMNS = 5;
const DEFAULT_GAP = 8;

const COLORS = {
  dark: {
    border: "#3a3a3c",
    filledBorder: "#565758",
    emptyBg: "#121213",
    correct: "#538d4e",
    present: "#b59f3b",
    absent: "#3a3a3c",
    text: "#f9fafb",
    boardBg: "#121213",
  },
  light: {
    border: "#d3d6da",
    filledBorder: "#878a8c",
    emptyBg: "#ffffff",
    correct: "#6aaa64",
    present: "#c9b458",
    absent: "#787c7e",
    text: "#1a1a1b",
    boardBg: "#f5f5f5",
  },
};

export default function WordleBoard({
  guesses = [],
  rowCount = DEFAULT_ROWS,
  columnCount = DEFAULT_COLUMNS,
  tone,
  framed = false,
  maxWidth,
  maxHeight,
  gap = DEFAULT_GAP,
  style,
}: Props) {
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const resolvedTone = tone ?? (theme.mode === "dark" ? "dark" : "light");
  const basePalette = resolvedTone === "dark" ? COLORS.dark : COLORS.light;
  const palette = {
    ...basePalette,
    correct: theme.wordle.correct,
    present: theme.wordle.present,
    absent: theme.wordle.absent,
    text: theme.colors.textOnSurface,
  };

  const usableWidth = (maxWidth ?? windowWidth - 48);
  const usableHeight = (maxHeight ?? windowHeight);
  const horizontalSpace = Math.max(usableWidth, columnCount);
  const verticalSpace = Math.max(usableHeight, rowCount);

  const spacing = Math.max(4, gap);

  const tileFromWidth = (horizontalSpace - (columnCount - 1) * spacing) / columnCount;
  const tileFromHeight = (verticalSpace - (rowCount - 1) * spacing) / rowCount;
  const tileSize = Math.max(18, Math.floor(Math.min(tileFromWidth, tileFromHeight)));

  if (!Number.isFinite(tileSize) || tileSize <= 0) {
    return null;
  }

  const boardWidth = columnCount * tileSize + (columnCount - 1) * spacing;
  const letterSize = Math.max(16, Math.floor(tileSize * 0.52));
  const tileRadius = Math.max(6, Math.floor(tileSize * 0.22));

  const rows = useMemo(() => {
    return Array.from({ length: rowCount }, (_, rowIndex) => {
      const guess = guesses[rowIndex];
      const letters = guess?.letters?.toUpperCase() ?? "";
      const states = guess?.states ?? [];

      return Array.from({ length: columnCount }, (_, colIndex) => {
        const letter = letters[colIndex] ?? "";
        const state = states[colIndex] ?? (letter ? "tbd" : "empty");
        return { letter, state };
      });
    });
  }, [guesses, rowCount, columnCount]);

  return (
    <View
      style={[
        framed
          ? [
              styles.framed,
              {
                borderColor: palette.border,
                backgroundColor: palette.boardBg,
              },
            ]
          : null,
        { alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <View style={{ width: boardWidth }}>
        {rows.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: rowIndex === rowCount - 1 ? 0 : spacing,
            }}
          >
            {row.map(({ letter, state }, colIndex) => {
              let backgroundColor = palette.emptyBg;
              let borderColor = palette.border;
              let textColor = palette.text;

              if (state === "correct") {
                backgroundColor = palette.correct;
                borderColor = palette.correct;
                textColor = "#ffffff";
              } else if (state === "present") {
                backgroundColor = palette.present;
                borderColor = palette.present;
                textColor = "#ffffff";
              } else if (state === "absent") {
                backgroundColor = palette.absent;
                borderColor = palette.absent;
                textColor = "#ffffff";
              } else if (state === "tbd") {
                borderColor = palette.filledBorder;
              }

              return (
                <View
                  key={`row-${rowIndex}-col-${colIndex}`}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    borderRadius: tileRadius,
                    borderWidth: 2,
                    borderColor,
                    backgroundColor,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: colIndex === columnCount - 1 ? 0 : spacing,
                  }}
                >
                  <Text
                    style={[
                      styles.letter,
                      {
                        color: textColor,
                        fontSize: letterSize,
                      },
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  framed: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 18,
  },
  letter: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
