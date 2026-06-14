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
    // Permission granted — proceed to next onboarding step
    // router.replace("/(onboarding)/set-goal");
  };

  return (
    <AuthScreenWrapper>
      <AuthTitle>Allow screen time tracking</AuthTitle>

      <Text style={[styles.body, { color: colors.text }]}>
        LockIn needs access to your devices's screen time data to track daily
        usage and automate allowance releases. This is a one-time setup done by
        you (or your guardian). Android only
      </Text>

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

      {permissionGranted === true ? (
        <Button variant="primary" size="lg" onPress={handleContinue}>
          Continue
        </Button>
      ) : (
        <Button variant="primary" size="lg" onPress={requestPermission}>
          Grant access
        </Button>
      )}

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
});
