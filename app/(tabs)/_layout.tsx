import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wallet, House, Settings as SettingsIcon } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

const isIOS26 =
  Platform.OS === "ios" && parseInt(Platform.Version.toString(), 10) >= 26;

function NativeTabLayout() {
  const { NativeTabs, Icon } = require("expo-router/unstable-native-tabs");
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon
          sf={{
            default: "dollarsign.circle",
            selected: "dollarsign.circle.fill",
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stakes">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const TAB_BAR_HEIGHT = 64;

function ClassicTabLayout() {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          marginLeft: "20%",
          marginRight: "20%",

          bottom: Math.max(insets.bottom, 16),
          height: TAB_BAR_HEIGHT,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: 32,
          borderTopWidth: 0,
          backgroundColor: isIOS ? "transparent" : colors.surface3,
          overflow: "hidden",
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarIconStyle: {
          margin: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.surface2,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  borderRadius: 32,
                },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Wallet size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="stakes"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon
              size={24}
              color={color}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isIOS26) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
