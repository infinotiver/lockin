import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenTime } from "@/hooks/useScreenTime";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { msToHoursAndMinutes } from "@/lib/screenTime";

export default function RecordsScreen() {
  const colors = useColors();
  const { report, formattedTotal, loading, error, permissionGranted, sync } =
    useScreenTime();

  if (Platform.OS !== "android") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text
          style={[
            styles.pageTitle,
            { color: colors.text, fontFamily: commonTheme.font.bold },
          ]}
        >
          Records
        </Text>
        <View style={styles.center}>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Screen time tracking is Android only.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionGranted === false) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <Text
          style={[
            styles.pageTitle,
            { color: colors.text, fontFamily: commonTheme.font.bold },
          ]}
        >
          Records
        </Text>
        <View style={styles.center}>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Usage access not granted.
          </Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Go to Settings → Permissions to enable it.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const appEntries = report?.byApp
    ? Object.entries(report.byApp)
        // .filter(([pkg]) => !isSystemApp(pkg))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
    : [];

  const totalMs = appEntries.reduce((sum, [, ms]) => sum + ms, 0);

  const displayTotal = msToHoursAndMinutes(totalMs);
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={sync}
            tintColor={colors.textMuted}
          />
        }
      >
        <Text
          style={[
            styles.pageTitle,
            { color: colors.text, fontFamily: commonTheme.font.bold },
          ]}
        >
          Records
        </Text>

        {error && (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        )}

        {/* Today's total */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            TODAY'S SCREEN TIME
          </Text>
          <Text
            style={[
              styles.totalTime,
              { color: colors.text, fontFamily: commonTheme.font.bold },
            ]}
          >
            {loading ? "—" : formattedTotal}
          </Text>
          {report?.date && (
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {report.date}
            </Text>
          )}
        </View>

        {/* Per-app breakdown */}
        {appEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              BY APP
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
              {appEntries.map(([pkg, ms], index) => {
                const percent = totalMs > 0 ? ms / totalMs : 0;
                const appName = pkg.split(".").pop() ?? pkg;
                const isLast = index === appEntries.length - 1;

                return (
                  <View key={pkg}>
                    <View style={styles.appRow}>
                      <Text
                        style={[styles.appName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {appName}
                      </Text>
                      <Text
                        style={[
                          styles.appTime,
                          {
                            color: colors.text,
                            fontFamily: commonTheme.font.medium,
                          },
                        ]}
                      >
                        {msToHoursAndMinutes(ms)}
                      </Text>
                    </View>

                    {/* inline mini bar */}
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: colors.surface2 },
                      ]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${Math.round(percent * 100)}%` as any,
                          },
                        ]}
                      />
                    </View>

                    {!isLast && (
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: colors.surface2 },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {!loading && appEntries.length === 0 && !error && (
          <View style={styles.center}>
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              No usage data yet for today.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: commonTheme.space.lg,
    paddingBottom: 80,
    gap: commonTheme.space.xl,
  },
  pageTitle: {
    fontSize: 28,
    paddingBottom: commonTheme.space.sm,
  },
  section: {
    gap: commonTheme.space.sm,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: commonTheme.font.medium,
  },
  totalTime: {
    fontSize: 48,
    letterSpacing: -1,
  },
  date: {
    fontSize: 13,
  },
  card: {
    borderRadius: commonTheme.rounded.lg,
    overflow: "hidden",
    paddingHorizontal: commonTheme.space.lg,
  },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: commonTheme.space.md,
  },
  appName: {
    fontSize: 14,
    flex: 1,
    marginRight: commonTheme.space.md,
    textTransform: "capitalize",
  },
  appTime: {
    fontSize: 14,
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: commonTheme.space.sm,
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  error: {
    fontSize: 13,
  },
  center: {
    paddingTop: commonTheme.space["2xl"],
    gap: commonTheme.space.sm,
    alignItems: "center",
  },
  muted: {
    fontSize: 14,
    textAlign: "center",
  },
});
