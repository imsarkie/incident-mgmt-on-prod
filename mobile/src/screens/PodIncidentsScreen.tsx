import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { PodIncidentCard } from "../components/PodIncidentCard";
import { CacheNotice } from "../components/CacheNotice";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { EmptyState, ErrorState, LoadingState } from "../components/RequestState";
import { usePodIncidents } from "../hooks/usePodIncidents";
import { colors } from "../constants/theme";
import type { PodIncident } from "../types/k8s";
import type { TabScreenProps } from "../navigation/types";

export function PodIncidentsScreen({ navigation }: TabScreenProps<"Incidents">) {
  const { data, error, isLoading, isRefreshing, isFromCache, cachedAt, refetch } = usePodIncidents();

  function handlePress(incident: PodIncident) {
    navigation.navigate("PodDetail", { namespace: incident.namespace, name: incident.podName });
  }

  if (isLoading) return <LoadingState label="Loading incidents…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(incident) => incident.id}
        renderItem={({ item }) => <PodIncidentCard incident={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <ConnectionIndicator />
            {isFromCache && cachedAt && <CacheNotice cachedAt={cachedAt} />}
          </View>
        }
        ListEmptyComponent={<EmptyState message="No active incidents. Cluster looks healthy." />}
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
