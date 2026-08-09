import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { BaseModal } from "@/components/ui/BaseModal";
import commonTheme from "@/constants/theme";

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InfoModal = ({ visible, onClose }: InfoModalProps) => {
  const colors = useColors();

  return (
    <BaseModal
      visible={visible}
      onDismiss={onClose}
      title="How LockIn Works"
      actions={[{ label: "Got it", onPress: onClose }]}
    >
      <View style={styles.stepList}>
        <Text style={{ color: colors.text }}>
          We need screen time permission to calculate your daily screen time for
          stakes eligibility
        </Text>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  stepList: {
    gap: commonTheme.space.lg,
    marginVertical: commonTheme.space.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: commonTheme.space.md,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: commonTheme.rounded.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
