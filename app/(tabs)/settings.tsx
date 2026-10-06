import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  UsersIcon,
  UserPlusIcon,
  CheckSquareIcon,
  InfoIcon,
  LogOutIcon,
} from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";
import { styles } from "@/constants/settings.styles";
import { OptionsRow } from "@/components/ui/OptionsRow";
import { OptionsGroup } from "@/components/ui/OptionsGroup";
import { ScreenTimePermissionModal } from "@/components/modals/ScreenTimePermissionModal";
import { InfoModal } from "@/components/modals/InfoModal";
import { ViewFamilyModal } from "@/components/modals/ViewFamilyModal";
import ShareCodeModal from "@/components/share/ShareCodeModal";
import { AppBar } from "@/components/ui/AppBar";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut, getToken } = useAuth();

  const [showPermModal, setShowPermModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [familyLoadError, setFamilyLoadError] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  const loadSettingsContext = async () => {
    const familyId = user?.publicMetadata?.familyId;

    if (!familyId) {
      setFamilyName("");
      setFamilyCode("");
      setFamilyLoadError(false);
      return;
    }

    setLoadingFamily(true);
    setFamilyLoadError(false);

    try {
      const token = await getToken();

      const familyRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/families`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (familyRes.ok) {
        const data = await familyRes.json();
        setFamilyName(data.family?.name || "");
        setFamilyCode(data.family?.code || "");
      } else {
        setFamilyName("");
        setFamilyCode("");
        setFamilyLoadError(true);
      }
    } catch (e) {
      console.error("[SettingsScreen] Context aggregation failed:", e);
    } finally {
      setLoadingFamily(false);
    }
  };

  useEffect(() => {
    loadSettingsContext();
  }, [user?.publicMetadata?.familyId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 64 + Math.max(insets.bottom, 16) + commonTheme.space.sm }]}
      >
        <AppBar title="Settings" />

        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: colors.surfaceContainer },
          ]}
          activeOpacity={0.8}
        >
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.fullName ?? "User"}
            </Text>

            <Text
              style={[styles.email, { color: colors.text }]}
              numberOfLines={1}
            >
              {user?.primaryEmailAddress?.emailAddress ?? "No email"}
            </Text>
          </View>
        </TouchableOpacity>

        <OptionsGroup label="Family link">
          <OptionsRow
            icon={UsersIcon}
            label={
              loadingFamily
                ? "Loading family..."
                : familyLoadError
                  ? "Family unavailable"
                  : familyName || "No Family Attached"
            }
            onPress={() => setShowFamilyModal(true)}
          />

          <OptionsRow
            icon={UserPlusIcon}
            label="Invite member"
            onPress={() => {
              if (familyCode) {
                setShowShareModal(true);
              }
            }}
          />
        </OptionsGroup>

        {Platform.OS === "android" && (
          <OptionsGroup label="Permissions">
            <OptionsRow
              icon={CheckSquareIcon}
              label="Screen time access"
              onPress={() => setShowPermModal(true)}
            />

            <OptionsRow
              icon={InfoIcon}
              label="How does it work"
              onPress={() => setShowInfoModal(true)}
            />
          </OptionsGroup>
        )}

        <OptionsGroup label="Danger zone">
          <OptionsRow
            icon={LogOutIcon}
            label="Sign out"
            onPress={handleSignOut}
            isDestructive
          />
        </OptionsGroup>

        {showPermModal && (
          <ScreenTimePermissionModal
            visible={showPermModal}
            onClose={() => setShowPermModal(false)}
          />
        )}

        <InfoModal
          visible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />

        <ViewFamilyModal
          visible={showFamilyModal}
          onClose={() => setShowFamilyModal(false)}
        />

        {showShareModal && (
          <ShareCodeModal
            code={familyCode}
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
