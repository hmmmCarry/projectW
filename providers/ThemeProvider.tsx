import React, { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";

import { Theme, ThemeMode, getTheme } from "@/lib/theme";

type ThemePreference = "system" | ThemeMode;

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme() ?? Appearance.getColorScheme() ?? "light";
  const [preference, setPreference] = useState<ThemePreference>("system");

  const mode: ThemeMode = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;
  const theme = useMemo(() => getTheme(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      preference,
      setPreference,
    }),
    [theme, mode, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx.theme;
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePreference must be used within ThemeProvider");
  return {
    preference: ctx.preference,
    setPreference: ctx.setPreference,
    mode: ctx.mode,
  };
}


