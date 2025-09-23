import { useColorScheme } from "react-native";

type WordlePalette = {
  correct: string;
  present: string;
  absent: string;
};

type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  border: string;
  borderMuted: string;
  text: string;
  textMuted: string;
  textOnSurface: string;
  textOnAccent: string;
  accent: string;
  success: string;
  warning: string;
  neutral: string;
  backdrop: string;
};

type Theme = {
  mode: "light" | "dark";
  colors: ThemeColors;
  wordle: WordlePalette;
};

const lightTheme: Theme = {
  mode: "light",
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    surfaceSubtle: "#e2e8f0",
    border: "rgba(15,23,42,0.08)",
    borderMuted: "rgba(15,23,42,0.14)",
    text: "#0f172a",
    textMuted: "#475569",
    textOnSurface: "#0f172a",
    textOnAccent: "#f8fafc",
    accent: "#2563eb",
    success: "#16a34a",
    warning: "#eab308",
    neutral: "#94a3b8",
    backdrop: "rgba(15,23,42,0.65)",
  },
  wordle: {
    correct: "#6aaa64",
    present: "#c9b458",
    absent: "#787c7e",
  },
};

const darkTheme: Theme = {
  mode: "dark",
  colors: {
    background: "#0b1120",
    surface: "#0f172a",
    surfaceElevated: "#111827",
    surfaceSubtle: "#1e293b",
    border: "rgba(148,163,184,0.24)",
    borderMuted: "rgba(148,163,184,0.32)",
    text: "#e2e8f0",
    textMuted: "#cbd5f5",
    textOnSurface: "#e2e8f0",
    textOnAccent: "#0b1120",
    accent: "#3b82f6",
    success: "#22c55e",
    warning: "#fbbf24",
    neutral: "#475569",
    backdrop: "rgba(8,15,35,0.7)",
  },
  wordle: {
    correct: "#22c55e",
    present: "#eab308",
    absent: "#475569",
  },
};

export function getTheme(mode: "light" | "dark" = "light"): Theme {
  return mode === "dark" ? darkTheme : lightTheme;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}

export type { Theme };
