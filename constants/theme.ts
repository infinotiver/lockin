import { StyleSheet } from "react-native";

const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

const rounded = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  "2xl": 24,
  full: 999,
} as const;

const fontSize = {
  xs: 10,
  sm: 11,
  md: 13,
  lg: 14,
  xl: 15,
  "2xl": 16,
  "3xl": 18,
  "4xl": 20,
  "5xl": 22,
  "6xl": 24,
  "7xl": 28,
  "8xl": 32,
  "9xl": 44,
} as const;

export const font = {
  body: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",

  mono: "JetBrainsMono_400Regular",
  monoSemibold: "JetBrainsMono_600SemiBold",
  monoBold: "JetBrainsMono_700Bold",

  pixel: "PixelifySans_400Regular",
  pixelMedium: "PixelifySans_500Medium",
  pixelSemibold: "PixelifySans_600SemiBold",
  pixelBold: "PixelifySans_700Bold",
} as const;

const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
} as const;

const text = StyleSheet.create({
  pageTitle: {
    fontSize: fontSize["7xl"],
    fontFamily: font.body,
  },
  sectionTitle: {
    fontSize: fontSize["5xl"],
    fontFamily: font.bold,
  },
  cardTitle: {
    fontSize: fontSize["2xl"],
    fontFamily: font.bold,
  },
  body: {
    fontSize: fontSize.md,
    fontFamily: font.body,
  },
  bodyStrong: {
    fontSize: fontSize.md,
    fontFamily: font.bold,
  },
  caption: {
    fontSize: fontSize.sm,
    fontFamily: font.body,
  },
  label: {
    fontSize: fontSize.xs,
    fontFamily: font.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  button: {
    fontSize: fontSize.xl,
    fontFamily: font.bold,
  },
  link: {
    fontSize: fontSize.md,
    fontFamily: font.bold,
    textDecorationLine: "underline",
  },
  input: {
    fontSize: fontSize.xl,
    fontFamily: font.body,
  },
  authInput: {
    fontSize: fontSize.xl,
    fontFamily: font.mono,
  },
  amount: {
    fontSize: fontSize["5xl"],
    fontFamily: font.bold,
  },
  amountLarge: {
    fontSize: fontSize["9xl"],
    fontFamily: font.monoBold,
    lineHeight: 52,
  },
  error: {
    fontSize: fontSize.md,
    fontFamily: font.bold,
  },
});

const layout = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row" },
  center: { justifyContent: "center", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  screenContent: {
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  card: {
    gap: space.lg,
    borderRadius: rounded.lg,
    padding: space.lg,
    borderWidth: 1,
  },
  section: {
    borderRadius: rounded.xl,
    padding: space.lg,
    borderWidth: 1,
    gap: space.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: rounded.lg,
    paddingHorizontal: space.lg,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    height: "100%",
  },
  progressBar: { height: 4, borderRadius: rounded.sm, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: rounded.sm },
});

export const commonTheme = {
  space,
  rounded,
  font,
  fontSize,
  fontWeight,
  text,
  layout,
} as const;

export default commonTheme;
