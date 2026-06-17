// components/share/ShareCodeModal.tsx
import { View, Text, Pressable, Share, Platform } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import { AuthScreenWrapper } from "@/components/auth/AuthScreenWrapper";
import { AuthTitle } from "@/components/auth/AuthTitle";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import commonTheme from "@/constants/theme";
import * as Clipboard from "expo-clipboard";
import { useShareOrCopy } from "@/hooks/useShareOrCopy";
const { space, rounded, fontSize, font } = commonTheme;

type Sender = "teen" | "parent";

type Props = {
  code?: string;
  sender?: Sender;
};

const COPY: Record<
  Sender,
  { title: string; subtitle: string; shareMessage: string }
> = {
  teen: {
    title: "Invite your parent",
    subtitle:
      "Share this code with your parent so they can set up your allowance on LockIn.",
    shareMessage:
      "Hey! I'm using LockIn to manage my allowance. Join as my parent using code",
  },
  parent: {
    title: "Invite your teen",
    subtitle:
      "Share this code with your teen so they can join your family on LockIn.",
    shareMessage: "Hey! I've set up LockIn for your allowance. Join using code",
  },
};

const ShareCodeModal = ({ code = "ZZ-00000", sender = "parent" }: Props) => {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const { title, subtitle, shareMessage } = COPY[sender];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const { shareOrCopy, isCopied } = useShareOrCopy();

  const handlePress = () => {
    const payload = `${shareMessage} ${code}`;
    shareOrCopy(payload);
  };
  return (
    <AuthScreenWrapper>
      <AuthTitle>{title}</AuthTitle>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: fontSize.md,
          fontFamily: font.body,
          lineHeight: 20,
        }}
      >
        {subtitle}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.surface2,
          borderRadius: rounded.lg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
        }}
      >
        <Text
          style={{
            fontFamily: font.mono,
            fontSize: fontSize["5xl"],
            color: colors.text,
            letterSpacing: 8,
          }}
        >
          {code}
        </Text>
        <Pressable onPress={handleCopy} style={{ padding: space.xs }}>
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={20}
            color={copied ? colors.accent : colors.textMuted}
          />
        </Pressable>
      </View>

      <Button
        onPress={handlePress}
        label="Share invite"
        variant="secondary"
        fullWidth
        leftIcon={
          <Ionicons name="share-outline" size={16} color={colors.text} />
        }
      />
    </AuthScreenWrapper>
  );
};

export default ShareCodeModal;
