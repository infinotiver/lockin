import { useState } from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";
import { useThemeColor } from "@/components/Themed";

interface FocusedInputProps extends TextInputProps {
  // You can add custom props here if needed
}

export const FocusedInput = ({ style, ...props }: FocusedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const surface3 = useThemeColor({}, "surface3");
  const border = useThemeColor({}, "border");
  const text = useThemeColor({}, "text");
  const textMuted = useThemeColor({}, "textMuted");
  const focusBorder = useThemeColor({}, "focusBorder");

  return (
    <TextInput
      placeholderTextColor={textMuted}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      selectionColor={text} // Cursor color matching the text theme
      style={[
        styles.input,
        {
          backgroundColor: surface3,
          borderColor: isFocused ? focusBorder : border,
          color: text,
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
    borderRadius: 12, // Clean, subtle rounding
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "JetBrainsMono_400Regular", // Optional: system monospace fits the zen style well
  },
});
