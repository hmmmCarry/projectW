import { useTheme } from "@/providers/ThemeProvider";
import { Modal, Pressable, Text, View } from "react-native";

type Tile = "correct" | "present" | "absent" | "idle";
type GuessRow = Tile[]; // length 5 ideally

export default function OpponentProgressModal({
  visible,
  onClose,
  recent = [],
}: {
  visible: boolean;
  onClose: () => void;
  recent?: GuessRow[]; // pass up to last 3–6 rows later
}) {
  const theme = useTheme();
  const { colors, wordle } = theme;

  const getTileColors = (t: Tile) => {
    if (t === "correct") return wordle.correct;
    if (t === "present") return wordle.present;
    if (t === "absent") return wordle.absent;
    return colors.surfaceElevated;
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable 
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} 
        onPress={onClose} 
      />
      <View style={{
        marginHorizontal: 24,
        marginTop: "30%",
        borderRadius: 16,
        backgroundColor: colors.card,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>
          Opponent Progress
        </Text>

        {/* grid */}
        <View style={{ gap: 8 }}>
          {recent.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8 }}>
              {row.map((t, j) => (
                <View
                  key={j}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: getTileColors(t),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              ))}
            </View>
          ))}
          {recent.length === 0 && (
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>No guesses yet.</Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          style={{
            alignSelf: "flex-end",
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: colors.surfaceElevated,
          }}
        >
          <Text style={{ color: colors.text }}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
