import { useEffect } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { IncidentCard } from "../components/IncidentCard";
import { CacheNotice } from "../components/CacheNotice";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { EmptyState, ErrorState, LoadingState } from "../components/RequestState";
import { useIncidents } from "../hooks/useIncidents";
import { useConnection } from "../context/ConnectionContext";
import { colors, spacing } from "../constants/theme";
import type { Incident } from "../types/domain";
import type { TabScreenProps } from "../navigation/types";

function upsertIncident(list: Incident[], incoming: Incident): Incident[] {
  const index = list.findIndex((incident) => incident.id === incoming.id);
  if (index === -1) return [incoming, ...list];
  const next = [...list];
  next[index] = incoming;
  return next;
}

export function IncidentsScreen({ navigation }: TabScreenProps<"Incidents">) {
  const { data, error, isLoading, isRefreshing, isFromCache, cachedAt, refetch, mutate } = useIncidents();
  const { lastEvent } = useConnection();

  // Patch the existing list in place instead of refetching — a WebSocket message already
  // carries the full updated resource, so re-hitting the REST API would just be a wasted
  // round trip for data we already have. See docs/18-realtime-state.md.
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "incident_created" ||
      lastEvent.type === "incident_updated" ||
      lastEvent.type === "incident_resolved"
    ) {
      mutate((prev) => upsertIncident(prev ?? [], lastEvent.payload));
    }
  }, [lastEvent, mutate]);

  function handlePress(incident: Incident) {
    navigation.navigate("IncidentDetail", { incidentId: incident.id });
  }

  if (isLoading) return <LoadingState label="Loading incidents…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const activeCount = (data ?? []).filter((incident) => incident.status !== "resolved").length;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(incident) => incident.id}
        renderItem={({ item }) => <IncidentCard incident={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <ConnectionIndicator />
            <Text style={styles.summary}>{activeCount} active</Text>
            {isFromCache && cachedAt && <CacheNotice cachedAt={cachedAt} />}
          </View>
        }
        ListEmptyComponent={<EmptyState message="No incidents right now. All systems normal." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  summary: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
