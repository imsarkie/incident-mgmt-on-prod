import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetworkStatus } from "../context/NetworkContext";
import { colors, spacing } from "../constants/theme";

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.banner}>
      <Text style={styles.text}>You're offline — showing cached data</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.down,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
