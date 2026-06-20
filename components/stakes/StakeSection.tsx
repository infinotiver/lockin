import commonTheme from "@/constants/theme";
import { View, Text } from "react-native";
import type { Stake } from "@/types/stakes";
import StakeCard from "./StakeCard";
export default function StakeSection({
  title,
  data,
  colors,
  emptyMessage,
}: {
  title: string;
  data: Stake[];
  colors: any;
  emptyMessage: string;
}) {
  if (data.length === 0) return null; // Or render a mini empty state if preferred

  return (
    <View style={{ gap: commonTheme.space.md }}>
      <Text style={[commonTheme.text.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={{ gap: commonTheme.space.md }}>
        {data.map((stake) => (
          <StakeCard key={stake.id} stake={stake} />
        ))}
      </View>
    </View>
  );
}
