import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { useState } from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";
interface FocusedInputProps extends TextInputProps {
  // You can add custom props here if needed
}

export const FocusedInput = ({ style, ...props }: FocusedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const colors = useColors();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      selectionColor={colors.text} // Cursor color matching the text theme
      style={[
        styles.input,
        commonTheme.text.input,
        {
          backgroundColor: colors.surface3,
          borderColor: isFocused ? colors.focusBorder : colors.border,
          color: colors.text,
        },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: commonTheme.rounded.md,
    paddingHorizontal: commonTheme.space.lg,
  },
});
