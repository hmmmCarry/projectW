import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useSafeModal } from "@/lib/safeModal";
import { Theme } from "@/lib/theme";
import { useTheme } from "@/providers/ThemeProvider";

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const closeIconColor = theme.colors.text;

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
          <Ionicons name="close" size={18} color={closeIconColor} />
        </Pressable>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.emoji}>{winnerEmoji}</Text>
            <View style={styles.initialsPill}>
              <Text style={styles.initials}>{winnerInitials}</Text>
            </View>
            <View style={styles.crown}>
              <FontAwesome5 name="crown" size={18} color={theme.colors.warning} />
            </View>
          </View>
        </View>

        <Text style={styles.heading}>
          {winnerName} {isMeWinner ? "(You)" : ""} won!
        </Text>
        <Text style={styles.subheading}>The word was</Text>

        <View style={styles.wordRow}>
          {letters.map((letter, index) => (
            <View
              key={index}
              style={[
                styles.tileBase,
                styles.tileCorrect,
                index !== letters.length - 1 && styles.tileGap,
              ]}
            >
              <Text style={[styles.letter, styles.letterOnColor]}>{letter.trim()}</Text>
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
    },
    card: {
      position: "absolute",
      left: 24,
      right: 24,
      top: "26%",
      padding: 24,
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      backgroundColor:
        theme.mode === "dark" ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)",
    },
    avatarWrapper: {
      marginTop: 12,
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.borderMuted,
    },
    initials: {
      color: theme.colors.text,
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
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
    },
    subheading: {
      color: theme.colors.textMuted,
      fontSize: 14,
    },
    wordRow: {
      flexDirection: "row",
      marginTop: 8,
    },
    tileBase: {
      width: 48,
      height: 54,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderMuted,
      backgroundColor: theme.colors.surfaceSubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    tileGap: {
      marginRight: 10,
    },
    tileCorrect: {
      backgroundColor: theme.wordle.correct,
      borderColor: theme.wordle.correct,
    },
    letter: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "800",
    },
    letterOnColor: {
      color: theme.colors.textOnAccent,
    },
    rematchButton: {
      marginTop: 12,
      width: "100%",
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
    },
    rematchText: {
      color: theme.colors.textOnAccent,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}




