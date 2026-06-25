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

  // Records can be shown on android only
  if (Platform.OS !== "android") {
    return (
      <SafeAreaView
        style={[
          commonTheme.layout.flex,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={commonTheme.layout.screenContent}>
          <Text style={[commonTheme.text.pageTitle, { color: colors.text }]}>
            Records
          </Text>
          <View
            style={[
              commonTheme.layout.center,
              { marginTop: commonTheme.space["2xl"] },
            ]}
          >
            <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
              Screen time tracking is an Android-only feature.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  //ERROR: No permission
  if (permissionGranted === false) {
    return (
      <SafeAreaView
        style={[
          commonTheme.layout.flex,
          { backgroundColor: colors.background },
        ]}
        edges={["top"]}
      >
        <View style={commonTheme.layout.screenContent}>
          <Text style={[commonTheme.text.pageTitle, { color: colors.text }]}>
            Records
          </Text>
          <View
            style={[
              commonTheme.layout.center,
              {
                marginTop: commonTheme.space["2xl"],
                gap: commonTheme.space.sm,
              },
            ]}
          >
            <Text style={[commonTheme.text.bodyStrong, { color: colors.text }]}>
              Usage access not granted
            </Text>
            <Text
              style={[commonTheme.text.caption, { color: colors.textMuted }]}
            >
              Go to Settings → Permissions to enable tracking.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const appEntries = report?.byApp
    ? Object.entries(report.byApp)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
    : [];

  const totalMs = appEntries.reduce((sum, [, ms]) => sum + ms, 0);

  return (
    <SafeAreaView
      style={[commonTheme.layout.flex, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={sync}
            tintColor={colors.textMuted}
          />
        }
      >
        <Text style={[commonTheme.text.pageTitle, { color: colors.text }]}>
          Records
        </Text>

        {error && (
          <Text
            style={[
              commonTheme.text.error,
              { color: colors.errorColor || "#FF3B30" },
            ]}
          >
            {error}
          </Text>
        )}

        <View style={{ gap: commonTheme.space.xs }}>
          <Text style={[commonTheme.text.label, { color: colors.textMuted }]}>
            Today's Screen Time
          </Text>
          <Text style={[commonTheme.text.amountLarge, { color: colors.text }]}>
            {loading ? "—" : formattedTotal}
          </Text>
          {report?.date && (
            <Text
              style={[commonTheme.text.caption, { color: colors.textMuted }]}
            >
              {report.date}
            </Text>
          )}
        </View>

        {!loading && appEntries.length === 0 && !error && (
          <View
            style={[
              commonTheme.layout.center,
              { marginTop: commonTheme.space["2xl"] },
            ]}
          >
            <Text style={[commonTheme.text.body, { color: colors.textMuted }]}>
              No app usage recorded yet today.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: commonTheme.space.lg,
    paddingBottom: 100,
    gap: commonTheme.space.xl,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
