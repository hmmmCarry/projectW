import { useTheme } from "@/providers/ThemeProvider";
import React, { useEffect, useMemo, useRef } from "react";
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
  // light: {
  //   border: "#d3d6da",
  //   filledBorder: "#878a8c",
  //   emptyBg: "#ffffff",
  //   correct: "#6aaa64",
  //   present: "#c9b458",
  //   absent: "#787c7e",
  //   text: "#1a1a1b",
  //   boardBg: "#f5f5f5",
  // },
  light: {
    border: "#d3d6da",
    filledBorder: "#878a8c",
    emptyBg: "#ffffff",
    correct: "#99E66F", // Lime
    present: "#00C2A8", // Teal
    absent: "#34495E",  // Charcoal
    text: "#1a1a1b",
    boardBg: "#F4F6F9", // Soft Gray
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
  revealRowIndex = null,
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

  // flip animations per tile for the reveal row
  const flipAnim = useRef(Array.from({ length: columnCount }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (revealRowIndex == null) return;
    // run a staggered flip 0 -> 1
    const animations = flipAnim.map((v, i) =>
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ])
    );
    Animated.stagger(60, animations).start(() => {
      // reset for future rows
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
              }

              const isRevealRow = revealRowIndex === rowIndex && state !== "empty";
              const tilt = isRevealRow
                ? flipAnim[colIndex].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ["0deg", "90deg", "0deg"],
                  })
                : ("0deg" as const);
              const frontOpacity = isRevealRow ? flipAnim[colIndex].interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] }) : 1;
              const backOpacity = isRevealRow ? flipAnim[colIndex].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }) : (state === "tbd" ? 0.6 : 1);

              return (
                <Animated.View
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
                    backfaceVisibility: "hidden",
                    transform: [{ perspective: 800 }, { rotateX: tilt as any }],
                  }}
                >
                  <Animated.Text
                    style={[
                      styles.letter,
                      { color: textColor, fontSize: letterSize, opacity: frontOpacity as any },
                    ]}
                  >
                    {letter}
                  </Animated.Text>
                  <Animated.View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", opacity: backOpacity as any }}>
                    <Text style={[styles.letter, { color: "#ffffff", fontSize: letterSize }]}>{letter}</Text>
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
  },
});






// // WordleBoard.tsx
// import { MotiText, MotiView } from "moti";
// import React from "react";
// import { StyleSheet, useColorScheme, View } from "react-native";

// // --- Color Palette ---
// const COLORS = {
//   light: {
//     border: "#d3d6da",
//     filledBorder: "#878a8c",
//     emptyBg: "#ffffff",
//     correct: "#99E66F", // Lime
//     present: "#00C2A8", // Teal
//     absent: "#34495E",  // Charcoal
//     text: "#1a1a1b",
//     boardBg: "#F4F6F9", // Soft Gray
//   },
//   dark: {
//     border: "#3a3a3c",
//     filledBorder: "#565758",
//     emptyBg: "#121213",
//     correct: "#99E66F",
//     present: "#00C2A8",
//     absent: "#34495E",
//     text: "#d7dadc",
//     boardBg: "#000000",
//   },
// };

// const tileRadius = 8;
// const spacing = 4;
// const rowCount = 6;
// const columnCount = 5;

// export function WordleBoard({
//   guesses,
//   currentGuess,
//   revealRowIndex,
//   letterSize = 24,
//   tileSize = 60,
// }: {
//   guesses: { word: string; result: string[] }[];
//   currentGuess: string;
//   revealRowIndex: number;
//   letterSize?: number;
//   tileSize?: number;
// }) {
//   const colorScheme = useColorScheme();
//   const palette = colorScheme === "dark" ? COLORS.dark : COLORS.light;

//   return (
//     <View
//       style={[
//         styles.board,
//         { backgroundColor: palette.boardBg },
//       ]}
//     >
//       {Array.from({ length: rowCount }).map((_, rowIndex) => {
//         const guess = guesses[rowIndex];
//         const letters = guess
//           ? guess.word.split("")
//           : rowIndex === guesses.length
//           ? currentGuess.split("")
//           : [];

//         return (
//           <View key={rowIndex} style={styles.row}>
//             {Array.from({ length: columnCount }).map((_, colIndex) => {
//               const letter = letters[colIndex] || "";
//               let state: "empty" | "filled" | "correct" | "present" | "absent" =
//                 "empty";

//               if (guess) {
//                 state = (guess.result[colIndex] as any) || "filled";
//               } else if (letter) {
//                 state = "filled";
//               }

//               const backgroundColor =
//                 state === "correct"
//                   ? palette.correct
//                   : state === "present"
//                   ? palette.present
//                   : state === "absent"
//                   ? palette.absent
//                   : palette.emptyBg;

//               const borderColor =
//                 state === "empty"
//                   ? palette.border
//                   : state === "filled"
//                   ? palette.filledBorder
//                   : backgroundColor;

//               return (
//                 <MotiView
//                   key={colIndex}
//                   from={{ rotateX: "0deg" }}
//                   animate={{
//                     rotateX:
//                       revealRowIndex === rowIndex && state !== "empty"
//                         ? "180deg"
//                         : "0deg",
//                   }}
//                   transition={{
//                     type: "timing",
//                     duration: 350,
//                     delay: colIndex * 120, // stagger flip by letter
//                   }}
//                   style={{
//                     width: tileSize,
//                     height: tileSize,
//                     borderRadius: tileRadius,
//                     borderWidth: 2,
//                     borderColor,
//                     backgroundColor,
//                     alignItems: "center",
//                     justifyContent: "center",
//                     marginRight: colIndex === columnCount - 1 ? 0 : spacing,
//                   }}
//                 >
//                   <MotiText
//                     from={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     transition={{ delay: 150 }}
//                     style={[
//                       styles.letter,
//                       { color: palette.text, fontSize: letterSize },
//                     ]}
//                   >
//                     {letter}
//                   </MotiText>
//                 </MotiView>
//               );
//             })}
//           </View>
//         );
//       })}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   board: {
//     padding: spacing,
//     borderRadius: 16,
//     marginBottom: 16,
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginBottom: spacing,
//   },
//   letter: {
//     fontWeight: "bold",
//     textTransform: "uppercase",
//   },
// });
