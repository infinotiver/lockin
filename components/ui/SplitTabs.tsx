import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export type TabItem<T extends string = string> = {
  key: T;
  label: string;
  count?: number;
};

type SplitTabsProps<T extends string = string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  scrollable?: boolean; // use ScrollView for many tabs
};

export function SplitTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  scrollable = false,
}: SplitTabsProps<T>) {
  const colors = useColors();

  const renderTab = (tab: TabItem<T>) => {
    const isActive = activeTab === tab.key;
    const label =
      tab.count !== undefined && tab.count > 0
        ? `${tab.label} (${tab.count})`
        : tab.label;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          scrollable && styles.tabScrollable,
          isActive && { backgroundColor: colors.text },
        ]}
        onPress={() => onTabChange(tab.key)}
        activeOpacity={0.75}
      >
        <Text
          style={[
            styles.tabText,
            { color: isActive ? colors.background : colors.text },
            isActive && styles.tabTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          { backgroundColor: colors.surface2 },
        ]}
        style={styles.scrollWrapper}
      >
        {tabs.map(renderTab)}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface2 }]}>
      {tabs.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: commonTheme.space.sm,
    alignItems: "center",
    borderRadius: commonTheme.rounded.md,
  },
  tabText: {
    fontSize: 13,
    fontFamily: commonTheme.font.medium,
  },
  tabTextActive: {
    fontFamily: commonTheme.font.bold,
  },
  // scrollable variant
  scrollWrapper: {
    flexGrow: 0,
  },
  scrollContainer: {
    flexDirection: "row",
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.xs,
    gap: commonTheme.space.xs,
  },
  tabScrollable: {
    flex: 0,
    paddingHorizontal: commonTheme.space.lg,
  },
});
