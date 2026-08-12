import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ServiceCard } from "../components/ServiceCard";
import { CacheNotice } from "../components/CacheNotice";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { ServicesDashboard, type ActivityEntry } from "../components/ServicesDashboard";
import { EmptyState, ErrorState, LoadingState } from "../components/RequestState";
import { useServices } from "../hooks/useServices";
import { useConnection } from "../context/ConnectionContext";
import { colors } from "../constants/theme";
import type { Service } from "../types/domain";
import type { IncidentWebSocketEvent } from "../types/websocket";
import type { TabScreenProps } from "../navigation/types";

const MAX_ACTIVITY_ENTRIES = 5;

function describeEvent(event: IncidentWebSocketEvent): Omit<ActivityEntry, "id"> | null {
  switch (event.type) {
    case "incident_created":
      return { icon: "alert-circle", color: colors.down, message: `New incident: ${event.payload.title}`, timestamp: event.payload.createdAt };
    case "incident_updated":
      return { icon: "sync-circle", color: colors.degraded, message: `Updated: ${event.payload.title}`, timestamp: event.payload.updatedAt };
    case "incident_resolved":
      return { icon: "checkmark-circle", color: colors.healthy, message: `Resolved: ${event.payload.title}`, timestamp: event.payload.updatedAt };
    case "service_status_changed": {
      const tone = event.payload.status === "healthy" ? colors.healthy : event.payload.status === "degraded" ? colors.degraded : colors.down;
      const icon = event.payload.status === "healthy" ? "checkmark-circle" : event.payload.status === "degraded" ? "alert-circle" : "close-circle";
      return { icon, color: tone, message: `${event.payload.name} is now ${event.payload.status}`, timestamp: event.payload.lastCheckedAt };
    }
    default:
      return null;
  }
}

export function ServicesScreen({ navigation }: TabScreenProps<"Services">) {
  const { data, error, isLoading, isRefreshing, isFromCache, cachedAt, refetch, mutate } = useServices();
  const { lastEvent } = useConnection();
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (lastEvent?.type !== "service_status_changed") return;
    const updated = lastEvent.payload;
    mutate((prev) => (prev ?? []).map((service) => (service.id === updated.id ? updated : service)));
  }, [lastEvent, mutate]);

  useEffect(() => {
    if (!lastEvent) return;
    const described = describeEvent(lastEvent);
    if (!described) return;
    setRecentActivity((prev) => [{ id: `${lastEvent.type}-${described.timestamp}-${Math.random()}`, ...described }, ...prev].slice(0, MAX_ACTIVITY_ENTRIES));
  }, [lastEvent]);

  function handlePress(service: Service) {
    navigation.navigate("ServiceDetail", { serviceId: service.id, serviceName: service.name });
  }

  if (isLoading) return <LoadingState label="Loading services…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(service) => service.id}
        renderItem={({ item }) => <ServiceCard service={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <ConnectionIndicator />
            {isFromCache && cachedAt && <CacheNotice cachedAt={cachedAt} />}
            <ServicesDashboard services={data ?? []} recentActivity={recentActivity} />
          </View>
        }
        ListEmptyComponent={<EmptyState message="No services reporting yet." />}
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
});
