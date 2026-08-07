import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Linking } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const CHARITY_DONATION_URL = "https://your-charity-link-here"; // swap per stake/charity later

type Settlement = {
  id: string;
  amount: number;
  created_at: string;
  status: "pending" | "settled";
};

export function SettlementCard({
  settlement,
  onMarkSettled,
}: {
  settlement: Settlement;
  onMarkSettled: (id: string, note?: string) => Promise<void>;
}) {
  const colors = useColors();
  const [note, setNote] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onMarkSettled(settlement.id, note || undefined);
      setConfirmVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (settlement.status === "settled") {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
        <Button
          variant="secondary"
          onPress={() => {}}
          disabled
          style={styles.settledButton}
        >
          Settled
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface2 }]}>
      <Text
        style={[
          styles.amount,
          { color: colors.text, fontFamily: commonTheme.font.bold },
        ]}
      >
        ₹{settlement.amount}
      </Text>
      <Text style={[styles.date, { color: colors.textMuted }]}>
        Failed on {new Date(settlement.created_at).toLocaleDateString()}
      </Text>

      <Button
        variant="secondary"
        onPress={() => Linking.openURL(CHARITY_DONATION_URL)}
        style={styles.payButton}
      >
        Pay to charity
      </Button>

      <TextInput
        placeholder="Optional note (e.g. transaction ID)"
        placeholderTextColor={colors.textMuted}
        value={note}
        onChangeText={setNote}
        style={[
          styles.noteInput,
          { borderColor: colors.border, color: colors.text },
        ]}
      />

      <Button variant="primary" onPress={() => setConfirmVisible(true)}>
        Mark as settled
      </Button>

      <ConfirmDialog
        visible={confirmVisible}
        title="Mark as settled?"
        message="This confirms you've made the payment yourself. LockIn can't verify it."
        primary={{
          label: "Confirm",
          onPress: handleConfirm,
          loading: submitting,
        }}
        secondary={{
          label: "Cancel",
          onPress: () => setConfirmVisible(false),
        }}
        onDismiss={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: commonTheme.rounded.lg,
    padding: commonTheme.space.md,
    gap: commonTheme.space.sm,
  },
  amount: {
    fontSize: commonTheme.fontSize.xl,
  },
  date: {
    fontSize: commonTheme.fontSize.sm,
  },
  payButton: {
    marginTop: commonTheme.space.xs,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: commonTheme.rounded.md,
    padding: commonTheme.space.sm,
    fontSize: commonTheme.fontSize.md,
  },
  settledButton: {
    paddingVertical: commonTheme.space.lg, // taller than the default button — "big" per your ask
  },
});
