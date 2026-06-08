import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";

export default function NotFoundScreen() {
  const colors = useColors();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[commonTheme.text.cardTitle, { color: colors.text }]}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[commonTheme.text.link, { color: colors.accent }]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: { marginTop: 15, paddingVertical: 15 },
});
