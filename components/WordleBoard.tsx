import { useTheme } from "@/providers/ThemeProvider";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";

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
  // index of the row to animate flip reveal (e.g., the last submitted row)
  revealRowIndex?: number | null;
  onMetrics?: (m: { tileSize: number; spacing: number }) => void;
};

const DEFAULT_ROWS = 6;
const DEFAULT_COLUMNS = 5;
const DEFAULT_GAP = 5;

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
  gap = 5,
  style,
  revealRowIndex = null,
  onMetrics,
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

  // Improved sizing calculation for better consistency
  const containerWidth = maxWidth ?? Math.min(windowWidth - 32, 400);
  const spacing = Math.max(5, gap);
  
  // Calculate tile size based on container width with consistent spacing
  const availableWidth = containerWidth - (columnCount - 1) * spacing;
  const tileSize = Math.max(50, Math.floor(availableWidth / columnCount));
  
  // Ensure tile size is reasonable and consistent
  const finalTileSize = Math.min(tileSize, 62); // Max 62px like web version
  const boardWidth = columnCount * finalTileSize + (columnCount - 1) * spacing;
  const letterSize = Math.max(20, Math.floor(finalTileSize * 0.5));
  const tileRadius = 6; // Consistent radius like web version

  // Report metrics when they change
  useEffect(() => {
    if (onMetrics) {
      onMetrics({ tileSize: finalTileSize, spacing });
    }
  }, [finalTileSize, spacing, onMetrics]);

  // Improved flip animations with better timing
  const flipAnim = useRef(Array.from({ length: columnCount }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (revealRowIndex == null) return;
    // Staggered flip animation with better timing (like web version)
    const animations = flipAnim.map((v, i) =>
      Animated.sequence([
        Animated.delay(i * 150), // Increased delay for better visual effect
        Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ])
    );
    Animated.stagger(75, animations).start(() => {
      // Reset for future rows
      flipAnim.forEach((v) => v.setValue(0));
    });
  }, [revealRowIndex, flipAnim]);

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
                backgroundColor = palette.emptyBg;
                textColor = palette.text;
              } else {
                // empty state
                borderColor = palette.border;
                backgroundColor = palette.emptyBg;
                textColor = palette.text;
              }

              const isRevealRow = revealRowIndex === rowIndex && state !== "empty";
              const flipRotation = isRevealRow
                ? flipAnim[colIndex].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ["0deg", "90deg", "0deg"],
                  })
                : ("0deg" as const);
              
              // Improved opacity interpolation for smoother transitions
              const frontOpacity = isRevealRow 
                ? flipAnim[colIndex].interpolate({ 
                    inputRange: [0, 0.5, 1], 
                    outputRange: [1, 0, 0] 
                  }) 
                : 1;
              const backOpacity = isRevealRow 
                ? flipAnim[colIndex].interpolate({ 
                    inputRange: [0, 0.5, 1], 
                    outputRange: [0, 0, 1] 
                  }) 
                : 1;

              return (
                <Animated.View
                  key={`row-${rowIndex}-col-${colIndex}`}
                  style={{
                    width: finalTileSize,
                    height: finalTileSize,
                    borderRadius: tileRadius,
                    borderWidth: 2,
                    borderColor,
                    backgroundColor,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: colIndex === columnCount - 1 ? 0 : spacing,
                    backfaceVisibility: "hidden",
                    transform: [{ perspective: 1000 }, { rotateX: flipRotation as any }],
                  }}
                >
                  <Animated.Text
                    style={[
                      styles.letter,
                      { 
                        color: textColor, 
                        fontSize: letterSize, 
                        opacity: frontOpacity as any,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {letter}
                  </Animated.Text>
                  <Animated.View 
                    style={{ 
                      position: "absolute", 
                      inset: 0, 
                      alignItems: "center", 
                      justifyContent: "center", 
                      opacity: backOpacity as any,
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <Text style={[
                      styles.letter, 
                      { 
                        color: "#ffffff", 
                        fontSize: letterSize,
                        fontWeight: "700",
                      }
                    ]}>
                      {letter}
                    </Text>
                  </Animated.View>
                </Animated.View>
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
    textAlign: "center",
  },
});




