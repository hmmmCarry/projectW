import { useTheme } from "@/providers/ThemeProvider";
import { normalizeGuessStates } from "@/utils/normalizeGuess";
import { View } from "react-native";

type CellState = "correct" | "present" | "absent" | "idle" | "filled";
type CellStateInput = CellState | "green" | "yellow" | "gray";

type Props = {
  rows?: number;
  cols?: number;
  filled?: number;
  size?: number;
  gap?: number;
  radius?: number;
  tone?: "light" | "dark";
  patterns?: CellStateInput[][];
};

function MicroProgressGrid({
  rows = 4,
  cols = 5,
  filled = 0,
  size = 8,
  gap = 2,
  radius = 2,
  tone,
  patterns,
}: Props) {
  const theme = useTheme();
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

  const makeIdleRow = () => Array.from({ length: cols }, () => "idle" as CellState);

  const cellStates: CellState[] = (() => {
    if (sanitizedPatterns && sanitizedPatterns.length > 0) {
      const sanitizedCount = sanitizedPatterns.length;
      const startIndex = sanitizedCount > rows ? sanitizedCount - rows : 0;
      const visibleRows = sanitizedPatterns.slice(startIndex, sanitizedCount);
      const paddedRows = [...visibleRows, ...Array.from({ length: rows - visibleRows.length }, makeIdleRow)];
      return paddedRows.flat();
    }

    const clampedFilled = Math.max(0, Math.min(total, filled));
    return Array.from({ length: total }, (_, i) => (i < clampedFilled ? "filled" : "idle"));
  })();

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
        padding: 4,
        borderRadius: 8,
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
                borderWidth: 0.5,
                borderColor: border,
                backgroundColor: colorFor(state),
                marginRight: isLastInRow ? 0 : gap,
                marginBottom: isLastRow ? 0 : gap,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default MicroProgressGrid;