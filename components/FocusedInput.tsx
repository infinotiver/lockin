import { useColors } from "@/hooks/useColors";
import { RADIUS, SPACING, FONT_SIZES } from "@/constants/tokens";
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
    borderRadius: RADIUS.md, // Clean, subtle rounding
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.xl,
    fontFamily: "JetBrainsMono_400Regular", // Optional: system monospace fits the zen style well
  },
});
