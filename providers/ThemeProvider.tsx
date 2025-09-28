import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark";
type Preference = "system" | ThemeMode;

type ThemeColors = {
  background: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  textOnAccent: string;
  textOnSurface: string;
  surface: string;
  surfaceElevated: string;
  success: string;
  neutral: string;
};

type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  wordle: {
    correct: string;
    present: string;
    absent: string;
  };
};

type ThemePreferenceContext = {
  preference: Preference;
  setPreference: (p: Preference) => void;
  mode: ThemeMode;
};

const ThemeContext = createContext<Theme | undefined>(undefined);
const ThemePreferenceContext = createContext<ThemePreferenceContext | undefined>(
  undefined
);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const system = useColorScheme();
  const [preference, setPreference] = useState<Preference>("system");

  const mode: ThemeMode = useMemo(() => {
    if (preference === "system") return (system || "light") as ThemeMode;
    return preference;
  }, [preference, system]);

  const colors: ThemeColors = useMemo(() => {
    if (mode === "dark") {
      return {
        background: "#0b0b10",
        card: "#111827",
        border: "rgba(255,255,255,0.10)",
        text: "#e5e7eb",
        textMuted: "#9ca3af",
        accent: "#6366f1",
        textOnAccent: "#ffffff",
        textOnSurface: "#f9fafb",
        surface: "#111827",
        surfaceElevated: "#1f2937",
        success: "#22c55e",
        neutral: "#6b7280",
      };
    }
    return {
      background: "#F6F6FE",
      card: "#ffffff",
      border: "rgba(0,0,0,0.08)",
      text: "#111827",
      textMuted: "#6b7280",
      accent: "#7c3aed",
      textOnAccent: "#ffffff",
      textOnSurface: "#1a1a1b",
      surface: "#ffffff",
      surfaceElevated: "#f3f4f6",
      success: "#22c55e",
      neutral: "#9ca3af",
    };
  }, [mode]);

  const wordle = useMemo(() => {
    if (mode === "dark") {
      return {
        correct: "#538d4e",
        present: "#b59f3b",
        absent: "#3a3a3c",
      };
    }
    return {
      correct: "#6aaa64",
      present: "#c9b458",
      absent: "#787c7e",
    };
  }, [mode]);

  const theme: Theme = useMemo(() => ({ mode, colors, wordle }), [mode, colors, wordle]);

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference, mode }}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemePreferenceContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export const useThemePreference = () => {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx)
    throw new Error("useThemePreference must be used within ThemeProvider");
  return ctx;
};

