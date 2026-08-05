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
  background: "#F9F9F9",

  surface1: "#FCFCFC", // card
  surface2: "#F7F7F7", // sidebar
  surface3: "#EFEFEF", // muted

  text: "#202020",
  textMuted: "#646464",

  primary: "#644A40",
  onPrimary: "#FFFFFF",

  accent: "#E8E8E8",
  onAccent: "#202020",

  secondary: "#FFDFB5",
  onSecondary: "#582D1D",

  muted: "#EFEFEF",

  destructive: "#E54D2E",
  onDestructive: "#FFFFFF",

  errorColor: "#E54D2E",
  success: "#166534",
  warning: "#D97706",

  border: "#D8D8D8",
  focusBorder: "#644A40",

  input: "#D8D8D8",

  tint: "#644A40",

  selected: "#644A4020",
};

const dark: ThemeColors = {
  background: "#111111",

  surface1: "#191919", // card
  surface2: "#222222", // muted
  surface3: "#2A2A2A", // accent

  text: "#EEEEEE",
  textMuted: "#B4B4B4",

  primary: "#FFE0C2",
  onPrimary: "#081A1B",

  accent: "#2A2A2A",
  onAccent: "#EEEEEE",

  secondary: "#393028",
  onSecondary: "#FFE0C2",

  muted: "#222222",

  destructive: "#E54D2E",
  onDestructive: "#FFFFFF",

  errorColor: "#E54D2E",
  success: "#22C55E",
  warning: "#F59E0B",

  border: "#201E18",
  focusBorder: "#FFE0C2",

  input: "#484848",

  tint: "#FFE0C2",

  selected: "#FFE0C226",
};

export const COLOR_THEMES: Record<ThemeMode, ThemeColors> = {
  light,
  dark,
};
