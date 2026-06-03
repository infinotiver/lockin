const light = {
  background: "#F2F0EA",
  surface1: "#F7F5EE",
  surface2: "#ECEAE3",
  surface3: "#E5E2D9",

  text: "#1A1A1A",
  textMuted: "#888888",

  primary: "#1A1A1A",
  onPrimary: "#FFFFFF",

  accent: "#E8D900", // yellow — carried from original
  onAccent: "#1A1A1A",

  card: "#FFFFFF",
  onCard: "#1A1A1A",
  secondary: "#F7F5EE",
  onSecondary: "#1A1A1A",
  muted: "#ECEAE3",

  destructive: "#EF4444",
  onDestructive: "#FFFFFF",
  error: "#BF3939",
  success: "#16A34A",
  warning: "#D97706",
  earn: "#E8D900",

  border: "#E5E2D9",
  focusBorder: "#1A1A1A",
  input: "#E5E2D9",
  tint: "#1A1A1A",
};

export type ColorTheme = { [K in keyof typeof light]: string };
export type ColorKey = keyof ColorTheme;

const dark: ColorTheme = {
  background: "#000000",
  surface1: "#0A0A0A",
  surface2: "#1A1A1A",
  surface3: "#22222280",

  text: "#FFFFFF",
  textMuted: "#888888",

  primary: "#FFFFFF",
  onPrimary: "#000000",

  accent: "#E8D900", // yellow — same hex, sufficient contrast on dark
  onAccent: "#000000",

  card: "#1A1A1A",
  onCard: "#FFFFFF",
  secondary: "#0A0A0A",
  onSecondary: "#FFFFFF",
  muted: "#222222",

  destructive: "#EF4444",
  onDestructive: "#FFFFFF",
  error: "#C73E3E",
  success: "#16A34A",
  warning: "#D97706",
  earn: "#E8D900",

  border: "#1A1A1A",
  focusBorder: "#F2F2F2",
  input: "#1A1A1A",
  tint: "#FFFFFF",
};

const colors = { light, dark, radius: 20 };
export default colors;
