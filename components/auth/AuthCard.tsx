import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

export const AuthCard = ({ children }: { children: React.ReactNode }) => {
  const colors = useColors();
  return (
    <LinearGradient
      colors={[colors.surface1, colors.surface3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: "100%",
        maxWidth: 440,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 14,
      }}
    >
      {children}
    </LinearGradient>
  );
};
