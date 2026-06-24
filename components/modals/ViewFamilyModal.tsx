import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import commonTheme from "@/constants/theme";

type Member = {
  id: string;
  clerk_id: string;
  role: "individual" | "teen" | string;
  joined_at: string | null;
};

type FamilyDetails = {
  id: string;
  name: string;
  code: string;
  parent_clerk_id: string;
};

type ViewFamilyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ViewFamilyModal({ visible, onClose }: ViewFamilyModalProps) {
  const colors = useColors();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [family, setFamily] = useState<FamilyDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const familyId = user?.publicMetadata?.familyId;

  useEffect(() => {
    if (visible) {
      fetchFamilyDetails();
    } else {
      setError("");
    }
  }, [visible, familyId]);
  const fetchFamilyDetails = async () => {
    if (!familyId) {
      const msg = "No family associated with this profile metadata.";
      setError(msg);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      const targetUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/families`;

      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body?.error ?? "Failed to look up family details.");
        return;
      }

      setFamily(body.family);
      setMembers(body.members || []);
    } catch (e) {
      console.error(
        "[ViewFamilyModal] Error captured during fetch pipeline:",
        e,
      );
      setError("Network or server failure connecting to household registry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} title="Family Details">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        )}

        {!!error && !loading && (
          <View>
            <Text style={{ color: colors.destructive }}>{error}</Text>
          </View>
        )}

        {!loading && !error && family && (
          <View>
            <View>
              <Text style={{ color: colors.text }}>{family.name}</Text>
              <Text style={{ color: colors.textMuted }}>ID: {family.id}</Text>
            </View>

            <View style={{ paddingVertical: commonTheme.space.md }}>
              <Text style={{ color: colors.textMuted }}>
                Registered Members ({members.length})
              </Text>

              {members.map((member, index) => {
                const isCurrentUser = member.clerk_id === user?.id;

                return (
                  <View key={member.id}>
                    <Text style={{ color: colors.text }}>
                      {isCurrentUser
                        ? `${user?.firstName || "You (Active Context)"}`
                        : `User (${member.clerk_id.substring(0, 12)}...)`}
                    </Text>
                    <Text style={{ color: colors.textMuted }}>
                      {member.role}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </BaseModal>
  );
}
