import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "../components/StatusBadge";
import { CacheNotice } from "../components/CacheNotice";
import { ErrorState, LoadingState } from "../components/RequestState";
import { useServiceDetail } from "../hooks/useServices";
import { colors, spacing } from "../constants/theme";
import type { RootStackScreenProps } from "../navigation/types";

export function ServiceDetailScreen({ route }: RootStackScreenProps<"ServiceDetail">) {
  const { serviceId } = route.params;
  const { data: service, error, isLoading, isFromCache, cachedAt, refetch } = useServiceDetail(serviceId);

  if (isLoading) return <LoadingState label="Loading service…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!service) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isFromCache && cachedAt && <CacheNotice cachedAt={cachedAt} />}
      <View style={styles.headerRow}>
        <Text style={styles.name}>{service.name}</Text>
        <StatusBadge label={service.status} tone={service.status} />
      </View>
      <Text style={styles.description}>{service.description}</Text>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Uptime</Text>
        <Text style={styles.statValue}>{service.uptimePercent}%</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Last checked</Text>
        <Text style={styles.statValue}>{new Date(service.lastCheckedAt).toLocaleTimeString()}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
