import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";

import { useTheme, useThemePreference } from "@/providers/ThemeProvider";

export const ThemeToggle = () => {
  const theme = useTheme();
  const { preference, setPreference, mode } = useThemePreference();

  const cyclePreference = () => {
    if (preference === "system") {
      setPreference("light");
    } else if (preference === "light") {
      setPreference("dark");
    } else {
      setPreference("system");
    }
  };

  const indicatorLeft = useMemo(() => {
    switch (preference) {
      case "system":
        return 6;
      case "dark":
        return 62;
      default:
        return 34;
    }
  }, [preference]);

  return (
    <Pressable
      onPress={cyclePreference}
      accessibilityLabel="Toggle theme"
      style={{
        width: 104,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor:
          theme.mode === "dark" ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.08)",
      }}
    >
      <Ionicons name="sunny-outline" size={20} color={theme.colors.text} />
      <Ionicons name="contrast-outline" size={20} color={theme.colors.textMuted} />
      <Ionicons name="moon-outline" size={20} color={theme.colors.text} />
      <View
        style={{
          position: "absolute",
          top: 6,
          left: indicatorLeft,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={mode === "dark" ? "moon" : mode === "light" ? "sunny" : "contrast"}
          size={16}
          color={theme.colors.textOnAccent}
        />
      </View>
    </Pressable>
  );
};

