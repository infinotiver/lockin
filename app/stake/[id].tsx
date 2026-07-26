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
import { formatDate, formatDuration } from "@/lib/timeParser";

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
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

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


  const renderHeader = () => (
    <View
      style={[
        commonTheme.layout.rowBetween,
        styles.tableRow,
        styles.tableHeader,
        { backgroundColor: colors.surface1, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          commonTheme.text.bodyStrong,
          styles.cellDate,
          { color: colors.text },
        ]}
      >
        Date
      </Text>
      <Text
        style={[
          commonTheme.text.bodyStrong,
          styles.cellTime,
          { color: colors.text },
        ]}
      >
        Screen Time
      </Text>
      <Text
        style={[
          commonTheme.text.bodyStrong,
          styles.cellChecked,
          { color: colors.text },
        ]}
      >
        Last Updated
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: StakeDay }) => (
    <View
      style={[
        commonTheme.layout.rowBetween,
        styles.tableRow,
        { borderColor: colors.border },
      ]}
    >
      <Text
        style={[commonTheme.text.body, styles.cellDate, { color: colors.text }]}
      >
        {formatDate(item.date)}
      </Text>
      <Text
        style={[
          commonTheme.text.bodyStrong,
          styles.cellTime,
          { color: colors.primary },
        ]}
      >
        {formatDuration(item.total_ms)}
      </Text>
      <Text
        style={[
          commonTheme.text.body,
          styles.cellChecked,
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
    <View
      style={[
        commonTheme.layout.flex,
        {
          padding: commonTheme.space.lg,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          commonTheme.layout.rowBetween,
          { marginBottom: commonTheme.space.lg },
        ]}
      >
        <View>
          <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
            Daily Records
          </Text>
          <Text
            style={[
              commonTheme.text.caption,
              { color: colors.textMuted, marginTop: commonTheme.space.xs },
            ]}
          >
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
        <View style={[commonTheme.layout.flex, commonTheme.layout.center]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          contentContainerStyle={{ gap: commonTheme.space.xs }}
          ListEmptyComponent={
            <View
              style={[
                commonTheme.layout.center,
                { paddingVertical: commonTheme.space.xl },
              ]}
            >
              <Text
                style={[commonTheme.text.body, { color: colors.textMuted }]}
              >
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
  buttonContainer: {
    minWidth: 100,
  },
  tableRow: {
    paddingVertical: commonTheme.space.md,
    paddingHorizontal: commonTheme.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 1,
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
});
