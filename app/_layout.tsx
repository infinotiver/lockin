import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/tokenCache";
import { useColors } from "@/hooks/useColors";

import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
} from "@expo-google-fonts/geist-mono";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  StakeManagerDialogs,
  StakeManagerProvider,
} from "@/contexts/StakeManagerContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <StakeManagerProvider>
            <RootLayoutNav />
          </StakeManagerProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
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
        let success = false;

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

          if (!res.ok) return;

          await user.reload();
          success = true;
        } catch (e) {
          console.error(
            "[RootLayout] Role promotion synchronization failed:",
            e,
          );
        } finally {
          if (!success) {
            rolePromotionAttempted.current = false;
          }
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
      router.replace("/(auth)/index");
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
    <>
      <Stack
        screenOptions={{
          // headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(onboarding)/individual"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(onboarding)/teen"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen
          name="stake/[id]"
          options={{
            title: "Stake details",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface3,
            },
            headerTintColor: colors.text,
          }}
        />
      </Stack>
      <StakeManagerDialogs />
    </>
  );
}
