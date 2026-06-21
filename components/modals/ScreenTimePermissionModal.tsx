import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useScreenTime } from "@/hooks/useScreenTime";
import { useColors } from "@/hooks/useColors";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/Button";
import commonTheme from "@/constants/theme";

const STEPS = [
  "Tap 'Grant access' below",
  "Find LockIn in the list",
  'Enable "Permit usage access"',
  "Return to the app",
];

interface ScreenTimePermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScreenTimePermissionModal = ({
  visible,
  onClose,
}: ScreenTimePermissionModalProps) => {
  const colors = useColors();
  const { permissionGranted, requestPermission } = useScreenTime();

  const handleSuccessContinue = () => {
    onClose();
    router.replace("/stakes");
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={permissionGranted ? "You're all set" : "Allow screen time access"}
      message={
        permissionGranted
          ? "LockIn is tracking your screen time. Your stakes will now update automatically."
          : "LockIn needs one-time access to your screen time data to verify your goals and release stakes automatically."
      }
    >
      {/* ─── MODAL BODY ────────────────────────────────────────────────── */}
      {permissionGranted ? (
        <View
          style={[styles.successBanner, { backgroundColor: colors.surface3 }]}
        >
          <Feather name="check-circle" size={24} color={colors.primary} />
          <View style={commonTheme.layout.flex}>
            <Text style={[commonTheme.text.bodyStrong, { color: colors.text }]}>
              Access Verified
            </Text>
            <Text
              style={[commonTheme.text.caption, { color: colors.textMuted }]}
            >
              Background tracking is active
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.stepsList}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepCircle, { borderColor: colors.border }]}>
                <Text
                  style={[
                    commonTheme.text.caption,
                    { color: colors.textMuted, fontWeight: "700" },
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={[commonTheme.text.body, { color: colors.text, flex: 1 }]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ─── PRIMARY CTA ───────────────────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <Button
          variant="primary"
          size="md" // 'lg' gets too bulky inside a 400px wide modal
          onPress={
            permissionGranted ? handleSuccessContinue : requestPermission
          }
          label={permissionGranted ? "Continue" : "Grant access"}
          fullWidth
        />

        {permissionGranted === false && (
          <Text
            style={[
              commonTheme.text.caption,
              { color: colors.textMuted, textAlign: "center" },
            ]}
          >
            Follow the steps above, then return here.
          </Text>
        )}
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  stepsList: {
    gap: commonTheme.space.md,
    marginVertical: commonTheme.space.sm,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: commonTheme.space.md,
    padding: commonTheme.space.md,
    borderRadius: commonTheme.rounded.md,
    marginVertical: commonTheme.space.xs,
  },
  ctaContainer: {
    marginTop: commonTheme.space.xl,
    gap: commonTheme.space.sm,
  },
});
