import { View, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Button title="Scan Booklet" onPress={() => router.push("/camera")} />
      <Button title="View Progress Chart" onPress={() => router.push("/chart")} />
    </View>
  );
}
