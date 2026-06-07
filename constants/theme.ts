import { StyleSheet } from "react-native";

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 24,
  full: 999,
} as const;

export const TYPE_SCALE = {
  xs: 10,
  sm: 11,
  base: 12,
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

export const FONTS = {
  body: "JetBrainsMono_400Regular",
  strong: "JetBrainsMono_600SemiBold",
  extraBold: "JetBrainsMono_800ExtraBold",
  display: "PixelifySans_400Regular",
} as const;

export const FONT_WEIGHTS = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
} as const;

export const TYPOGRAPHY = StyleSheet.create({
  pageTitle: {
    fontSize: TYPE_SCALE["7xl"],
    fontFamily: FONTS.display,
    letterSpacing: -0.8,
  },
  sectionTitle: {
    fontSize: TYPE_SCALE["3xl"],
    fontFamily: FONTS.strong,
  },
  cardTitle: {
    fontSize: TYPE_SCALE["2xl"],
    fontFamily: FONTS.strong,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: TYPE_SCALE.md,
    fontFamily: FONTS.body,
  },
  bodySemibold: {
    fontSize: TYPE_SCALE.md,
    fontFamily: FONTS.strong,
  },
  caption: {
    fontSize: TYPE_SCALE.sm,
    fontFamily: FONTS.body,
  },
  label: {
    fontSize: TYPE_SCALE.xs,
    fontFamily: FONTS.strong,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  buttonText: {
    fontSize: TYPE_SCALE.xl,
    fontFamily: FONTS.strong,
    letterSpacing: -0.2,
  },
  footerText: {
    fontSize: TYPE_SCALE.md,
    fontFamily: FONTS.body,
  },
  linkText: {
    fontSize: TYPE_SCALE.md,
    fontFamily: FONTS.strong,
    textDecorationLine: "underline",
  },
  input: {
    fontSize: TYPE_SCALE.xl,
    fontFamily: FONTS.body,
  },
  amount: {
    fontSize: TYPE_SCALE["5xl"],
    fontFamily: FONTS.strong,
    letterSpacing: -0.5,
  },
  amountLarge: {
    fontSize: TYPE_SCALE["9xl"],
    fontFamily: FONTS.extraBold,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  errorText: {
    fontSize: TYPE_SCALE.md,
    fontFamily: FONTS.strong,
  },
});

export const LAYOUT = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row" },
  center: { justifyContent: "center", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  screenContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    gap: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  section: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: TYPE_SCALE.md,
    height: "100%",
  },
  progressBar: { height: 4, borderRadius: RADIUS.sm, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: RADIUS.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "82%",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalScrollContent: { padding: SPACING.lg },
  topButton: {
    position: "absolute",
    right: SPACING.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
});
