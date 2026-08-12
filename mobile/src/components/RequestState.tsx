import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry && <Text style={styles.retry} onPress={onRetry}>Tap to retry</Text>}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  retry: {
    color: colors.primary,
    fontSize: 14,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
});
