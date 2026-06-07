import { View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/clerk-expo";
import { SPACING, TYPOGRAPHY } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
const HomeScreen = () => {
  const colors = useColors();
  const { signOut } = useAuth();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        flex: 1,
        padding: SPACING.md,
        gap: SPACING.md,
      }}
    >
      <Text style={[TYPOGRAPHY.sectionTitle, { color: colors.text }]}>
        Welcome back, user
      </Text>

      <Button onPress={() => signOut()} label="Sign out" />
      <Button onPress={() => signOut()} label="Sign out" variant="secondary" />
      <Button onPress={() => signOut()} label="Sign out" variant="ghost" />
      <Button
        onPress={() => signOut()}
        label="Sign out"
        variant="destructive"
      />
    </View>
  );
};

export default HomeScreen;
