import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

export function CacheNotice({ cachedAt }: { cachedAt: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Showing cached data from {new Date(cachedAt).toLocaleTimeString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },
});
