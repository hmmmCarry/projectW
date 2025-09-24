import { useTheme } from "@/providers/ThemeProvider";
import { normalizeGuessStates } from "@/utils/normalizeGuess";
import React from "react";
import { View } from "react-native";

type CellState = "correct" | "present" | "absent" | "idle" | "filled";
type CellStateInput = CellState | "green" | "yellow" | "gray";

type Props = {
  rows?: number;          // default 4
  cols?: number;          // default 5
  /** cells filled from top-left across, then down; e.g. guesses*5 */
  filled?: number;        // 0..rows*cols
  size?: number;          // px per square
  gap?: number;           // px gap between squares
  radius?: number;        // corner radius for each square
  /** light/dark neutral greys only (no brand yet) */
  tone?: "light" | "dark";
  patterns?: CellStateInput[][]; // optional explicit grid states
};

function MicroProgressGrid({
  rows = 4,
  cols = 5,
  filled = 0,
  size = 11,
  gap = 2,
  radius = 4,
  tone,
  patterns,
}: Props) {
  const theme = useTheme();
  const resolvedTone = tone ?? (theme.mode === "dark" ? "dark" : "light");
  const total = rows * cols;
  const hasPatterns = Array.isArray(patterns) && patterns.length > 0;

  const sanitizedPatterns: CellState[][] | undefined = hasPatterns
    ? patterns!.map((row) =>
        Array.from({ length: cols }, (_, i) => {
          const value = row?.[i];
          if (value === "correct" || value === "present" || value === "absent") {
            return value as CellState;
          }
          if (value === "green" || value === "yellow" || value === "gray") {
            const normalized = normalizeGuessStates([value]);
            return normalized[0] as CellState;
          }
          return "idle";
        })
      )
    : undefined;

  // Debug logging
  if (hasPatterns) {
    console.log("MicroProgressGrid patterns:", patterns);
    console.log("MicroProgressGrid sanitizedPatterns:", sanitizedPatterns);
  }

  const activeRows = sanitizedPatterns ? sanitizedPatterns.slice(-rows) : undefined;
  const idleRow = Array.from({ length: cols }, () => "idle" as CellState);
  const paddedRows = activeRows
    ? [...Array.from({ length: rows - activeRows.length }, () => idleRow), ...activeRows]
    : Array.from({ length: rows }, () => idleRow);

  const cellStates: CellState[] = sanitizedPatterns
    ? paddedRows.flat()
    : Array.from({ length: total }, (_, i) => (i < Math.max(0, Math.min(total, filled)) ? "filled" : "idle"));

  const border = theme.colors.border;
  const palette = {
    idle: theme.colors.surfaceElevated,
    filled: theme.colors.neutral,
    correct: theme.wordle.correct,
    present: theme.wordle.present,
    absent: theme.wordle.absent,
  } as const;

  const colorFor = (state: CellState) => {
    if (state === "correct" || state === "present" || state === "absent") return palette[state];
    if (state === "filled") return palette.filled;
    return palette.idle;
  };

  return (
    <View
      style={{
        padding: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          width: cols * size + (cols - 1) * gap,
        }}
      >
        {cellStates.map((state, i) => {
          const isLastInRow = (i + 1) % cols === 0;
          const isLastRow = i >= cellStates.length - cols;

          return (
            <View
              key={i}
              style={{
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: colorFor(state),
                marginRight: isLastInRow ? 0 : gap,
                marginBottom: isLastRow ? 0 : gap,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 1,
                shadowOffset: { width: 0, height: 1 },
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
export default MicroProgressGrid;
