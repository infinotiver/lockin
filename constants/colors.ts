export type ThemeColors = {
  background: string;
  surface1: string;
  surface2: string;
  surface3: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  secondary: string;
  onSecondary: string;
  muted: string;
  destructive: string;
  onDestructive: string;
  errorColor: string;
  success: string;
  warning: string;
  border: string;
  focusBorder: string;
  input: string;
  tint: string;
  selected: string;
};

export type ThemeMode = "light" | "dark";

const light: ThemeColors = {
  background: "#F2F0EA",
  surface1: "#F7F5EE",
  surface2: "#ECEAE3",
  surface3: "#E5E2D9",
  text: "#1A1A1A",
  textMuted: "#888888",
  primary: "#1A1A1A",
  onPrimary: "#FFFFFF",
  accent: "#be6a0bff",
  onAccent: "#1A1A1A",
  secondary: "#F7F5EE",
  onSecondary: "#1A1A1A",
  muted: "#ECEAE3",
  destructive: "#EF4444",
  onDestructive: "#FFFFFF",
  errorColor: "#BF3939",
  success: "#16A34A",
  warning: "#D97706",
  border: "#E5E2D9",
  focusBorder: "#1A1A1A",
  input: "#E5E2D9",
  tint: "#1A1A1A",
  selected: "#3cded333",
};

const dark: ThemeColors = {
  background: "#000000",
  surface1: "#0A0A0A",
  surface2: "#1A1A1A",
  surface3: "#222222",
  text: "#FFFFFF",
  textMuted: "#888888",
  primary: "#FFFFFF",
  onPrimary: "#000000",
  accent: "#4e62ff",
  onAccent: "#fff",
  secondary: "#0A0A0A",
  onSecondary: "#FFFFFF",
  muted: "#222222",
  destructive: "#EF4444",
  onDestructive: "#FFFFFF",
  errorColor: "#C73E3E",
  success: "#16A34A",
  warning: "#D97706",
  border: "#1A1A1A",
  focusBorder: "#F2F2F2",
  input: "#1A1A1A",
  tint: "#FFFFFF",
  selected: "#4e62ff",
};

export const COLOR_THEMES: Record<ThemeMode, ThemeColors> = {
  light,
  dark,
};
