import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";

export default function ParentHome() {
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: tabBarHeight }}>
      <Text>Parent Home</Text>
    </View>
  );
}
