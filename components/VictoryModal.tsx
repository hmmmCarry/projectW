import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useSafeModal } from "@/lib/safeModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRematch: () => void;
  winnerName: string;
  winnerInitials?: string;
  winnerEmoji?: string;
  isMeWinner?: boolean;
  correctWord: string;
};

export default function VictoryModal({
  visible,
  onClose,
  onRematch,
  winnerName,
  winnerInitials = "TP",
  winnerEmoji = "🏆",
  isMeWinner = false,
  correctWord = "",
}: Props) {
  const { visible: modalVisible, open, close } = useSafeModal(false, 80);

  useEffect(() => {
    if (visible) open();
    else close();
  }, [visible, open, close]);

  const handleClose = useCallback(() => {
    close();
    onClose();
  }, [close, onClose]);

  const handleRematch = useCallback(() => {
    onRematch();
    handleClose();
  }, [handleClose, onRematch]);

  const letters = correctWord.toUpperCase().padEnd(5, " ").slice(0, 5).split("");

  return (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss victory modal"
      />

      <View style={styles.card}>
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={18} color="#e2e8f0" />
        </Pressable>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.emoji}>{winnerEmoji}</Text>
            <View style={styles.initialsPill}>
              <Text style={styles.initials}>{winnerInitials}</Text>
            </View>
            <View style={styles.crown}>
              <FontAwesome5 name="crown" size={18} color="#fbbf24" />
            </View>
          </View>
        </View>

        <Text style={styles.heading}>{winnerName} {isMeWinner ? "(You)" : ""} won!</Text>
        <Text style={styles.subheading}>The word was</Text>

        <View style={styles.wordRow}>
          {letters.map((letter, index) => (
            <View key={index} style={styles.letterTile}>
              <Text style={styles.letter}>{letter.trim()}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.rematchButton} onPress={handleRematch} accessibilityRole="button">
          <Text style={styles.rematchText}>Rematch</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.75)",
  },
  card: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "26%",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    alignItems: "center",
    gap: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148,163,184,0.12)",
  },
  avatarWrapper: {
    marginTop: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 44,
  },
  initialsPill: {
    position: "absolute",
    bottom: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  initials: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
  },
  crown: {
    position: "absolute",
    top: -12,
    right: -12,
  },
  heading: {
    marginTop: 24,
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subheading: {
    color: "#cbd5f5",
    fontSize: 14,
  },
  wordRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  letterTile: {
    width: 48,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
  },
  rematchButton: {
    marginTop: 12,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  rematchText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
});
