import { FlatList, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "../components/StatusBadge";
import { CacheNotice } from "../components/CacheNotice";
import { EmptyState, ErrorState, LoadingState } from "../components/RequestState";
import { useIncidentDetail, useIncidentTimeline } from "../hooks/useIncidents";
import { colors, spacing } from "../constants/theme";
import type { RootStackScreenProps } from "../navigation/types";
import type { TimelineEvent } from "../types/domain";

export function IncidentDetailScreen({ route }: RootStackScreenProps<"IncidentDetail">) {
  const { incidentId } = route.params;
  const incident = useIncidentDetail(incidentId);
  const timeline = useIncidentTimeline(incidentId);

  if (incident.isLoading) return <LoadingState label="Loading incident…" />;
  if (incident.error) return <ErrorState message={incident.error} onRetry={incident.refetch} />;
  if (!incident.data) return null;

  return (
    <FlatList
      style={styles.container}
      data={timeline.data ?? []}
      keyExtractor={(event) => event.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          {incident.isFromCache && incident.cachedAt && <CacheNotice cachedAt={incident.cachedAt} />}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{incident.data.title}</Text>
            <StatusBadge label={incident.data.severity} tone={incident.data.severity} />
          </View>
          <Text style={styles.description}>{incident.data.description}</Text>
          <StatusBadge label={incident.data.status} tone={incident.data.status} />
          <Text style={styles.sectionTitle}>Timeline</Text>
        </View>
      }
      renderItem={({ item }: { item: TimelineEvent }) => (
        <View style={styles.event}>
          <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          <Text style={styles.eventMessage}>{item.message}</Text>
        </View>
      )}
      ListEmptyComponent={
        timeline.isLoading ? (
          <LoadingState label="Loading timeline…" />
        ) : (
          <EmptyState message="No timeline events yet." />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  event: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventTime: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  eventMessage: {
    color: colors.text,
    fontSize: 14,
  },
});
