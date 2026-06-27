import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { Button, ButtonVariant } from "@/components/ui/Button";

type DialogAction = {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  primary: DialogAction;
  secondary: DialogAction;
  onDismiss?: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  primary,
  secondary,
  onDismiss,
}: ConfirmDialogProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface2 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: commonTheme.font.bold },
            ]}
          >
            {title}
          </Text>

          {!!message && (
            <Text style={[styles.message, { color: colors.textMuted }]}>
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              variant={secondary.variant ?? "secondary"}
              onPress={secondary.onPress}
              loading={secondary.loading}
              disabled={secondary.disabled}
              style={styles.button}
            >
              {secondary.label}
            </Button>
            <Button
              variant={primary.variant ?? "primary"}
              onPress={primary.onPress}
              loading={primary.loading}
              disabled={primary.disabled}
              style={styles.button}
            >
              {primary.label}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: commonTheme.space.xl,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: commonTheme.rounded.xl,
    padding: commonTheme.space.xl,
    gap: commonTheme.space.md,
  },
  title: {
    fontSize: commonTheme.fontSize.xl,
    textAlign: "center",
  },
  message: {
    fontSize: commonTheme.fontSize.md,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: commonTheme.space.sm,
    marginTop: commonTheme.space.sm,
  },
  button: {
    flex: 1,
  },
});
