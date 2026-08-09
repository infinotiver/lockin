import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { Button, ButtonVariant } from "@/components/ui/Button";

type ModalAction = {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

type BaseModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  // 0 actions = content-only modal (children render their own buttons, or it's purely informational).
  // Last action defaults to "primary", the rest to "secondary" unless overridden.
  actions?: ModalAction[];
  // Backdrop tap + hardware back close the modal. Set false to force a choice via `actions`.
  dismissable?: boolean;
  // Wraps children in a capped-height ScrollView — for forms/long content that might overflow.
  scrollable?: boolean;
  onDismiss: () => void;
  children?: React.ReactNode;
};

export function BaseModal({
  visible,
  title,
  message,
  actions,
  dismissable = true,
  scrollable = false,
  onDismiss,
  children,
}: BaseModalProps) {
  const colors = useColors();
  const Body = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissable ? onDismiss : undefined}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={dismissable ? onDismiss : undefined}
      >
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface2 }]}
          onPress={(e) => e.stopPropagation()}
        >
          {!!title && (
            <Text
              style={[
                styles.title,
                { color: colors.text, fontFamily: commonTheme.font.bold },
              ]}
            >
              {title}
            </Text>
          )}

          {!!message && (
            <Text style={[styles.message, { color: colors.textMuted }]}>
              {message}
            </Text>
          )}

          {!!children && (
            <Body style={scrollable ? styles.scrollBody : undefined}>
              {children}
            </Body>
          )}

          {!!actions?.length && (
            <View style={styles.actions}>
              {actions.map((action, i) => (
                <Button
                  key={action.label}
                  variant={
                    action.variant ??
                    (i === actions.length - 1 ? "primary" : "secondary")
                  }
                  onPress={action.onPress}
                  loading={action.loading}
                  disabled={action.disabled}
                  style={styles.button}
                >
                  {action.label}
                </Button>
              ))}
            </View>
          )}
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
  scrollBody: {
    maxHeight: 400,
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
