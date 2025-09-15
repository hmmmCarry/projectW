import { vars } from "nativewind";

export const themes = {
  light: vars({
    "--color-primary": "#000000",
    "--color-secondary": "rgba(0, 0, 0, 0.1)",
    "--color-background": "#ffffff",
    "--color-text": "#000000",
  }),
  dark: vars({
    "--color-primary": "#ffffff",
    "--color-secondary": "rgba(255, 255, 255, 0.6)",
    "--color-background": "#000000",
    "--color-text": "#ffffff",
  }),
};
