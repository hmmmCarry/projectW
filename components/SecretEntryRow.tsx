// import { getRandomWord } from "@/api";
// import { useTheme } from "@/providers/ThemeProvider";
// import { Text, View } from "react-native";

// type Props = {
//   value: string;
//   ready: boolean;
//   locked: boolean;
//   error: string | null;
//   length?: number;
//   gap?: number;
//   tileSize?: number;
//   enableRandomize?: boolean;
//   onChangeValue?: (value: string) => void;
// };

// export default function SecretEntryRow({ value, ready, locked, error, length = 5, gap = 5, tileSize = 56, enableRandomize = false, onChangeValue }: Props) {
//   const theme = useTheme();
//   const { wordle, colors } = theme;

//   // Visual parity with WordleBoard sizing defaults
//   const tileRadius = 6;
//   const letters = locked
//     ? Array.from({ length }).map(() => "*")
//     : value.padEnd(length, " ").split("");
//     const totalRowWidth = length * tileSize + (length - 1) * gap;

//   return (
//     <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
//          <View 
//         style={{ 
//           flexDirection: "row", 
//           width: totalRowWidth, // match board width
//           justifyContent: "center" 
//         }}
//       >

      
//       {/* Letter tiles */}
//       {letters.map((ch, idx) => {
//         let backgroundColor = colors.surface;
//         let borderColor = colors.border;
//         let textColor = colors.text;

//         if (locked) {
//           backgroundColor = wordle.correct;
//           borderColor = wordle.correct;
//           textColor = "#ffffff";
//         } else if (error) {
//           borderColor = "#ef4444";
//         } else if (ready) {
//           borderColor = colors.accent;
//         }

//         return (
//           <View
//             key={idx}
//             style={{
//               width: tileSize,
//               height: tileSize,
//               borderRadius: tileRadius,
//               borderWidth: 2,
//               borderColor,
//               backgroundColor,
//               alignItems: "center",
//               justifyContent: "center",
//               marginRight: idx === letters.length - 1 ? 0 : gap,
//             }}
//           >
//             <Text style={{ fontSize: 20, fontWeight: "700", color: textColor }}>
//               {ch.trim()}
//             </Text>
//           </View>
//         );
//       })}
//       </View>
//       {/* Dice button (not a letter tile) */}
//       {enableRandomize && !locked && onChangeValue ? (
//         <Text
//           onPress={async () => {
//             try {
//               const word = (await getRandomWord())?.toString?.().toUpperCase?.() || "";
//               if (word && /^[A-Z]{5}$/.test(word)) {
//                 onChangeValue(word);
//               }
//             } catch (e) {
//               console.warn("Random word failed", e);
//             }
//           }}
//           style={{
//             width: tileSize,
//             height: tileSize,
//             marginLeft: gap ,
//             textAlign: "center",
//             textAlignVertical: "center",
//             fontSize: Math.max(20, Math.floor(tileSize * 0.38)),
//             fontWeight: "800",
//             color: colors.text,
//             backgroundColor: "red",
//           }}
//         >
//           🎲
//         </Text>
//       ) : null}
      
//     </View>
//   );
// }

import { getRandomWord } from "@/api";
import { useTheme } from "@/providers/ThemeProvider";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  value: string;
  ready: boolean;
  locked: boolean;
  error: string | null;
  length?: number;
  gap?: number;
  tileSize?: number;
  enableRandomize?: boolean;
  onChangeValue?: (value: string) => void;
};

export default function SecretEntryRow({
  value,
  ready,
  locked,
  error,
  length = 5,
  gap = 5,
  tileSize = 56,
  enableRandomize = false,
  onChangeValue,
}: Props) {
  const theme = useTheme();
  const { wordle, colors } = theme;

  const tileRadius = Math.max(4, Math.floor(tileSize * 0.12));
  const letters = locked
    ? Array.from({ length }).map(() => "*")
    : value.padEnd(length, " ").split("");

  // width of the tiles block (exactly how the board calculates it)
  const totalRowWidth = length * tileSize + (length - 1) * gap;

  // make the die slightly smaller so it reads as a control (tweak as you like)
  const dieSize = Math.round(tileSize * 0.9);

  const [loading, setLoading] = React.useState(false);

  const handleRandom = async () => {
    if (!onChangeValue) return;
    setLoading(true);
    try {
      const word = (await getRandomWord())?.toString?.().toUpperCase?.() || "";
      if (word && /^[A-Z]{5}$/.test(word)) {
        onChangeValue(word);
      }
    } catch (e) {
      console.warn("Random word failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" ,marginLeft: gap*8}}>
      {/* this block has the exact width of the board tiles so they align */}
      <View style={{ width: totalRowWidth, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
        {letters.map((ch, idx) => {
          let backgroundColor = colors.surface;
          let borderColor = colors.border;
          let textColor = colors.text;

          if (locked) {
            backgroundColor = wordle.correct;
            borderColor = wordle.correct;
            textColor = "#ffffff";
          } else if (error) {
            borderColor = "#ef4444";
          } else if (ready) {
            borderColor = colors.accent;
          }

          return (
            <View
              key={idx}
              style={{
                width: tileSize,
                height: tileSize,
                borderRadius: tileRadius,
                borderWidth: 2,
                borderColor,
                backgroundColor,
                alignItems: "center",
                justifyContent: "center",
                marginRight: idx === letters.length - 1 ? 0 : gap,
              }}
            >
              <Text
                style={{
                  fontSize: Math.max(18, Math.floor(tileSize * 0.36)),
                  fontWeight: "700",
                  color: textColor,
                }}
                allowFontScaling={false}
              >
                {ch.trim()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Dice button attached after the tiles */}
      {enableRandomize && !locked && onChangeValue ? (
        <Pressable
          onPress={handleRandom}
          style={({ pressed }) => ({
            marginLeft: gap,
            // width: dieSize,
            // height: dieSize,
            // borderRadius: Math.max(6, Math.floor(dieSize * 0.2)),
            // borderWidth: 1,
            // borderColor: colors.border,
            // backgroundColor: colors.surfaceElevated ?? colors.surface,
            // alignItems: "center",
            // justifyContent: "center",
            // subtle pressed scale
            transform: [{ scale: pressed ? 0.96 : 1 }],
            shadowColor: theme.mode === "dark" ? "#000" : "#999",
            shadowOpacity: 0.18,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: pressed ? 1 : 2,
          })}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text
              style={{
                fontSize: Math.max(18, Math.floor(dieSize * 0.45)),
                textAlign: "center",
                includeFontPadding: false,
              }}
            >
              🎲
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}


