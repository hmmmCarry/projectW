import React from "react";
import { View } from "react-native";

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
};

export function MicroProgressGrid({
  rows = 4,
  cols = 5,
  filled = 0,
  size = 11,
  gap = 2,
  radius = 4,
  tone = "light",
}: Props) {
  const total = rows * cols;
  const cells = Array.from({ length: total });

  // keep everything neutral for now (works on #F6F6FE)
  const border = tone === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const box    = tone === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const off    = tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const on     = tone === "dark" ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)";

  return (
    <View
      style={{
        padding: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: "transparent",
      }}
      // keeps the outer rounded inset like your mock
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          width: cols * size + (cols - 1) * gap,
        }}
      >
        {cells.map((_, i) => {
          const active = i < filled;
          const isLastInRow = (i + 1) % cols === 0;
          const isLastRow   = i >= total - cols;

          return (
            <View
              key={i}
              style={{
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: active ? on : off,
                marginRight: isLastInRow ? 0 : gap,
                marginBottom: isLastRow ? 0 : gap,
                // subtle inner plate
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
