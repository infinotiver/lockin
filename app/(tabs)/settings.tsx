import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/clerk-expo";
import { View } from "react-native";

export default function HomeScreen() {
  const colors = useColors();
  const { signOut } = useAuth();

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
        onPress={() => signOut()}
        label="Sign out"
        variant="destructive"
        size="sm"
      >
        Sign out
      </Button>
    </View>
  );
}
