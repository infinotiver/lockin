import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { Button } from "@/components/ui/Button";

export default function Landing() {
  const colors = useColors();
  const router = useRouter();

  return (
    <AuthScreenWrapper>
      <View style={styles.container}>
        <View style={styles.centerBlock}>
          <Text style={[commonTheme.text.pageTitle, { color: colors.text }]}>
            LockIn
          </Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Put your money where your goals are.{"\n"}Beat your screen time or
            lose the bet.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={() => router.push("/(auth)/sign-up")}
            variant="primary"
            size="lg"
            label="Get started"
            fullWidth
          />
          <Button
            onPress={() => router.push("/(auth)/sign-in")}
            variant="neutral"
            size="lg"
            label="I already have an account"
            fullWidth
          />
        </View>
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
  },
  centerBlock: {
    justifyContent: "center",
    alignItems: "center",
    gap: commonTheme.space.sm,
    paddingHorizontal: commonTheme.space.lg,
  },
  tagline: {
    fontSize: commonTheme.fontSize.lg,
    fontFamily: commonTheme.font.body,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    gap: commonTheme.space.sm,
    marginTop: commonTheme.space.md,
  },
});
