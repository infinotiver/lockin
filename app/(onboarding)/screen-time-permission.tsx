import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useScreenTime } from "@/hooks/useScreenTime";
import { Button } from "@/components/ui/Button";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

const STEPS = [
  "Tap 'Grant access' below",
  "Find LockIn in the list",
  'Enable "Permit usage access"',
  "Return to the app",
];

export default function ScreenTimePermission() {
  const colors = useColors();
  const { permissionGranted, requestPermission } = useScreenTime();

  const handleContinue = () => {
    router.replace("/stakes");
  };

  return (
    <AuthScreenWrapper>
      <AuthTitle>
        {permissionGranted ? "You're all set" : "Allow screen time access"}
      </AuthTitle>

      <Text style={[styles.body, { color: colors.textMuted }]}>
        {permissionGranted
          ? "LockIn is tracking your screen time. Your stakes will now update automatically."
          : "LockIn needs one-time access to your screen time data to verify your goals and release stakes automatically."}
      </Text>

      {permissionGranted ? (
        <View
          style={[styles.successCard, { backgroundColor: colors.surface1 }]}
        >
          <View
            style={[
              styles.successIcon,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Feather name="check" size={20} color={colors.primary} />
          </View>
          <View style={styles.successText}>
            <Text
              style={[
                styles.successTitle,
                { color: colors.text, fontFamily: commonTheme.font.bold },
              ]}
            >
              Access granted
            </Text>
            <Text style={[styles.successSub, { color: colors.textMuted }]}>
              Tracking is active
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor: colors.surface1,
              borderRadius: commonTheme.rounded.md,
            },
          ]}
        >
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View
                style={[styles.stepNumber, { borderColor: colors.surface2 }]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    {
                      color: colors.textMuted,
                      fontFamily: commonTheme.font.medium,
                    },
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          onPress={permissionGranted ? handleContinue : requestPermission}
        >
          {permissionGranted ? "Continue" : "Grant access"}
        </Button>

        {permissionGranted === false && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Follow the steps above then return here.
          </Text>
        )}
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: commonTheme.space.xl,
  },
  stepsCard: {
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.lg,
    gap: commonTheme.space.lg,
    marginBottom: commonTheme.space.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 12,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  successCard: {
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
    marginBottom: commonTheme.space.xl,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    gap: 2,
  },
  successTitle: {
    fontSize: 15,
  },
  successSub: {
    fontSize: 13,
  },
  actions: {
    gap: commonTheme.space.md,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
