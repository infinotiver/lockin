// components/ui/BaseModal.tsx
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

export interface BaseModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export const BaseModal = ({
  visible,
  title,
  message,
  onClose,
  children,
}: BaseModalProps) => {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.surface2 },
              ]}
            >
              {title && (
                <Text style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>
              )}
              {message && (
                <Text style={[styles.message, { color: colors.textMuted }]}>
                  {message}
                </Text>
              )}

              {children}

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={{ color: colors.primary }}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: commonTheme.space.md,
  },
  modalContent: {
    width: "100%",
    maxWidth: 800,
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.lg,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: commonTheme.space.sm,
  },
  message: {
    fontSize: commonTheme.fontSize.md,
    marginBottom: 16,
  },
  closeButton: {
    alignItems: "flex-end",
    marginTop: commonTheme.space.md,
  },
});
