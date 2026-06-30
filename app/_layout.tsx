import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/tokenCache";
import { useColors } from "@/hooks/useColors";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from "@expo-google-fonts/pixelify-sans";
import { GoTrueClient } from "@supabase/supabase-js";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <RootLayoutNav />
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const colors = useColors();

  const rolePromotionAttempted = useRef(false);

  // Extract primitive values so React tracks actual data changes, not object references
  const publicRole = user?.publicMetadata?.role as string | undefined;
  const unsafeRole = user?.unsafeMetadata?.role as string | undefined;
  const onboarded = user?.publicMetadata?.onboarded as boolean | undefined;

  // 1. Decoupled Promotion Pipeline
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    if (!publicRole && unsafeRole && !rolePromotionAttempted.current) {
      rolePromotionAttempted.current = true;

      const promoteRole = async () => {
        try {
          const token = await getToken();
          if (!token) return;

          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/user/role`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ role: unsafeRole }),
            },
          );

          if (res.ok) {
            // Force Clerk to strictly pull the fresh JWT/Session claims
            await user.reload();
          }
        } catch (e) {
          console.error(
            "[RootLayout] Role promotion synchronization failed:",
            e,
          );
          rolePromotionAttempted.current = false; // Retry allowed on next mount if network dropped
        }
      };

      promoteRole();
    }
  }, [isSignedIn, isLoaded, publicRole, unsafeRole, user]);

  // 2. Strict Navigation Guard
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (isSignedIn) {
      // If promotion is currently inflight, hold navigation boundary strictly
      if (!publicRole) return;

      if (!onboarded && !inOnboarding) {
        router.replace(
          publicRole === "teen"
            ? "/(onboarding)/teen"
            : "/(onboarding)/individual",
        );
        return;
      }

      if (publicRole && onboarded && (inAuthGroup || inOnboarding)) {
        router.replace("/(tabs)");
        return;
      }
    }
  }, [isSignedIn, isLoaded, segments, publicRole, onboarded]); // <-- Bound strictly to primitive values

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)/individual" />
      <Stack.Screen name="(onboarding)/teen" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
