import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useScreenTime } from "@/hooks/useScreenTime";
import { Button } from "@/components//ui/Button";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { useColors } from "@/hooks/useColors";

export default function ScreenTimePermission() {
  const colors = useColors();
  const { permissionGranted, requestPermission } = useScreenTime();

  const handleContinue = () => {
    // router.replace("/(onboarding)/set-goal");
  };

  return (
    <AuthScreenWrapper>
      <AuthTitle>
        {permissionGranted ? "You're all set!" : "Allow screen time tracking"}
      </AuthTitle>

      <Text style={[styles.body, { color: colors.text }]}>
        {permissionGranted
          ? "LockIn is now tracking your screen time and will automatically manage your allowance based on your usage."
          : "LockIn needs access to your device's screen time data to track daily usage and automate allowance releases. This is a one-time setup."}
      </Text>

      {permissionGranted ? (
        <View style={styles.successRow}>
          <Text style={[styles.successText, { color: colors.text }]}>
            Screen time access granted and active
          </Text>
        </View>
      ) : (
        <View style={styles.steps}>
          {[
            "Tap 'Grant access' below",
            "Find LockIn in the list",
            'Enable "Permit usage access"',
            "Return to the app",
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View
                style={[styles.stepDot, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.stepText, { color: colors.text }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Button
        variant="primary"
        size="lg"
        onPress={permissionGranted ? handleContinue : requestPermission}
      >
        {permissionGranted ? "Continue" : "Grant access"}
      </Button>

      {permissionGranted === false && (
        <Text style={[styles.hint, { color: colors.destructive }]}>
          Permission not yet granted. Please follow the steps above.
        </Text>
      )}
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  steps: { gap: 12, marginBottom: 32 },
  step: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  stepText: { fontSize: 14, flex: 1 },
  hint: { fontSize: 13, marginTop: 12, textAlign: "center" },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  successText: { fontSize: 15, fontWeight: "600", flex: 1 },
});
