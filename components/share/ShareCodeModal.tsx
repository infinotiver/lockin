// components/share/ShareCodeModal.tsx

import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import commonTheme from "@/constants/theme";
import * as Clipboard from "expo-clipboard";
import { useShareOrCopy } from "@/hooks/useShareOrCopy";
import { BaseModal } from "../ui/BaseModal";

const { space, rounded, fontSize, font } = commonTheme;

type Sender = "teen" | "parent";

interface ShareCodeModalProps {
  code?: string;
  sender?: Sender;
  visible: boolean;
  onClose: () => void;
}

const COPY: Record<
  Sender,
  { title: string; subtitle: string; shareMessage: string }
> = {
  teen: {
    title: "Invite your parent",
    subtitle: "Send this code to your parent to join your family.",
    shareMessage: "Join my family on LockIn using this code:",
  },
  parent: {
    title: "Invite your teen",
    subtitle: "Send this code to your teen to join your family.",
    shareMessage: "Join my family on LockIn using this code:",
  },
};

const DEFAULT_COPY = {
  title: "Invite family",
  subtitle: "Use this code to invite people to your family.",
  shareMessage: "Join my family on LockIn using this code:",
};

const ShareCodeModal = ({
  code = "ZZ-00000",
  sender,
  visible,
  onClose,
}: ShareCodeModalProps) => {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const { shareOrCopy } = useShareOrCopy();

  const { title, subtitle, shareMessage } = sender
    ? COPY[sender]
    : DEFAULT_COPY;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShare = () => {
    shareOrCopy(`${shareMessage} ${code}`);
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <AuthTitle>{title}</AuthTitle>

      {!!subtitle && (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: fontSize.md,
            fontFamily: font.body,
            lineHeight: 22,
          }}
        >
          {subtitle}
        </Text>
      )}

      <View
        style={{
          backgroundColor: colors.surface2,
          borderRadius: rounded.xl,
          borderWidth: 1,
          borderColor: colors.border,
          gap: space.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: space.md,
            marginVertical: space.lg,
            borderRadius: rounded.md,
            backgroundColor: colors.surface3,
          }}
        >
          <Text
            style={{
              fontFamily: font.mono,
              fontSize: fontSize["4xl"],
              color: colors.text,
              letterSpacing: 4,
            }}
          >
            {code}
          </Text>

          <Pressable
            onPress={handleCopy}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
              padding: space.xs,
            }}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={20}
              color={copied ? colors.accent : colors.textMuted}
            />

            <Text
              style={{
                color: copied ? colors.accent : colors.textMuted,
                fontSize: fontSize.sm,
                fontFamily: font.medium,
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        onPress={handleShare}
        label="Share invite"
        variant="primary"
        fullWidth
        leftIcon={
          <Ionicons name="share-outline" size={16} color={colors.text} />
        }
      />
    </BaseModal>
  );
};

export default ShareCodeModal;
