// components/ui/ErrorText.tsx
import { Text, TextProps } from "react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

interface ErrorTextProps extends TextProps {
  error?: string | null;
}

export const ErrorText = ({ error, style, ...props }: ErrorTextProps) => {
  const colors = useColors();

  if (!error) return null;

  return (
    <Text
      style={[
        commonTheme.text.error,
        { lineHeight: 18, color: colors.errorColor || "#FF3B30" },
        style,
      ]}
      {...props}
    >
      {error}
    </Text>
  );
};
