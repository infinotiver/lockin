import { StyleSheet } from "react-native";
import commonTheme from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: commonTheme.space.md,
    paddingTop: commonTheme.space.lg,
    paddingBottom: commonTheme.space.xl,
  },

  // Profile Header Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: commonTheme.space.md,
    borderRadius: 16,
    marginBottom: commonTheme.space.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
    marginLeft: commonTheme.space.md,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
  },

  // Section Headers & Groups
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: commonTheme.space.sm,
    marginLeft: commonTheme.space.sm,
    opacity: 0.7,
  },
  cardGroup: {
    borderRadius: 16,
    marginBottom: commonTheme.space.lg,
    overflow: "hidden", // Ensures the rows respect the border radius
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: commonTheme.space.md,
    paddingHorizontal: commonTheme.space.md,
  },
  rowIcon: {
    marginRight: commonTheme.space.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevron: {
    opacity: 0.3,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50, // Indents the separator to align with text, bypassing the icon
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: commonTheme.space.sm,
    marginBottom: commonTheme.space.xl,
  },
  statCard: {
    flex: 1, // Ensures all 3 cards take up exactly 1/3 of the space
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: commonTheme.space.lg,
    borderRadius: commonTheme.rounded.xl,
  },
  statValue: {
    fontSize: 24,
    fontFamily: commonTheme.font.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: commonTheme.font.medium,
    opacity: 0.6,
  },
});
