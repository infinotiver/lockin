import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { View } from "react-native";
export default function HomeScreen() {
  const colors = useColors();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };
  return (
    <View
      style={{
        backgroundColor: colors.background,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        onPress={handleSignOut}
        label="Sign out"
        variant="destructive"
        size="sm"
        loading={isSigningOut}
        disabled={isSigningOut}
      >
        Sign out
      </Button>
    </View>
  );
}
