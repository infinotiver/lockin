import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ParentHome() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: insets.bottom + 60, // 60 is approximate tab bar height
      }}
    >
      <Text>Parent Home</Text>
    </View>
  );
}
