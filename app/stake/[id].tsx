import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { ErrorHandler } from "@/components/ui/ErrorHandler";
import { useAuth } from "@clerk/clerk-expo";
interface StakeDay {
  id: string;
  stake_id: string;
  clerk_ids: string[];
  date: string;
  checked_at: string;
  total_ms: number;
}

export default function StakeDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [records, setRecords] = useState<StakeDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchStakeDays = useCallback(async () => {
    if (!id || typeof id !== "string" || id === "undefined") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getTokenRef.current();
      const response = await fetch(`/api/days/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch records.");
      }

      setRecords(result.data || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong while fetching records.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStakeDays();
  }, [fetchStakeDays]);

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderHeader = () => (
    <View
      style={[
        styles.tableRow,
        styles.tableHeader,
        { backgroundColor: colors.surface1, borderColor: colors.border },
      ]}
    >
      <Text
        style={[styles.cellDate, styles.headerText, { color: colors.text }]}
      >
        Date
      </Text>
      <Text
        style={[styles.cellTime, styles.headerText, { color: colors.text }]}
      >
        Screen Time
      </Text>
      <Text
        style={[styles.cellChecked, styles.headerText, { color: colors.text }]}
      >
        Last Updated
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: StakeDay }) => (
    <View style={[styles.tableRow, { borderColor: colors.border }]}>
      <Text style={[styles.cellDate, styles.cellText, { color: colors.text }]}>
        {formatDate(item.date)}
      </Text>
      <Text
        style={[
          styles.cellTime,
          styles.cellText,
          { color: colors.primary, fontFamily: commonTheme.font.bold },
        ]}
      >
        {formatDuration(item.total_ms)}
      </Text>
      <Text
        style={[
          styles.cellChecked,
          styles.cellText,
          { color: colors.textMuted },
        ]}
      >
        {new Date(item.checked_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Daily Records
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Screen time tracked per day
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={fetchStakeDays}
            variant="secondary"
            size="sm"
            label="Refresh"
            loadingLabel="Loading..."
            loading={loading}
            monospace
          />
        </View>
      </View>

      <ErrorHandler error={error} type="text" onClear={() => setError("")} />

      {loading && records.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No screen time recorded for this stake yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: commonTheme.space.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: commonTheme.space.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: commonTheme.font.bold,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  buttonContainer: {
    minWidth: 100,
  },
  listContent: {
    gap: commonTheme.space.xs,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: commonTheme.space.md,
    paddingHorizontal: commonTheme.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  tableHeader: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: commonTheme.font.bold,
    fontSize: 13,
  },
  cellText: {
    fontSize: 14,
  },
  cellDate: {
    flex: 2,
  },
  cellTime: {
    flex: 1.5,
  },
  cellChecked: {
    flex: 1.5,
    textAlign: "right",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: commonTheme.space.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
