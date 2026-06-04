import React from "react";
import { Platform, View, useColorScheme } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

// Determine if device is running iOS 26 or higher
const isIOS26 =
  Platform.OS === "ios" && parseInt(Platform.Version.toString(), 10) >= 26;

// ─── NativeTabs Layout (iOS 26+) ─────────────────────────────────────────────
function NativeTabLayout() {
  // Lazy require to ensure it doesn't break bundlers on other platforms
  const {
    NativeTabs,
    Icon,
    Label,
  } = require("expo-router/unstable-native-tabs");

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stakes">
        <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
        <Label>Stakes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ─── ClassicTabs Layout (Web, Android, Older iOS) ───────────────────────────
function ClassicTabLayout() {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveTintColor: colors.accent,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : (
            Platform.OS === "web" && (
              <View style={{ backgroundColor: colors.surface2 }} />
            )
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stakes"
        options={{
          title: "Stakes",
          tabBarIcon: ({ color }) => (
            <Feather name="award" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={21} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isIOS26) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
