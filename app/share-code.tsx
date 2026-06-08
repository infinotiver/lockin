// app/share-code.tsx
import { useLocalSearchParams } from "expo-router";
import ShareCodeModal from "@/components/share/ShareCodeModal";

type Sender = "parent" | "teen";

export default function ShareCodeRoute() {
  const { sender, code } = useLocalSearchParams<{
    sender?: Sender;
    code?: string;
  }>();
  return <ShareCodeModal sender={sender ?? "parent"} code={code} />;
}
