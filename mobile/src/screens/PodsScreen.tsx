import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { PodCard } from "../components/PodCard";
import { CacheNotice } from "../components/CacheNotice";
import { ConnectionIndicator } from "../components/ConnectionIndicator";
import { GradientStatCard } from "../components/GradientStatCard";
import { StatBubble } from "../components/StatBubble";
import { EmptyState, ErrorState, LoadingState } from "../components/RequestState";
import { usePods } from "../hooks/usePods";
import { useOverview } from "../hooks/useOverview";
import { colors, gradients, spacing } from "../constants/theme";
import type { Pod } from "../types/k8s";
import type { TabScreenProps } from "../navigation/types";

export function PodsScreen({ navigation }: TabScreenProps<"Services">) {
  const { data, error, isLoading, isRefreshing, isFromCache, cachedAt, refetch } = usePods();
  const overview = useOverview();

  function handlePress(pod: Pod) {
    navigation.navigate("PodDetail", { namespace: pod.namespace, name: pod.name });
  }

  if (isLoading) return <LoadingState label="Loading pods…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(pod) => `${pod.namespace}/${pod.name}`}
        renderItem={({ item }) => <PodCard pod={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refetch();
              overview.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <ConnectionIndicator />
            {isFromCache && cachedAt && <CacheNotice cachedAt={cachedAt} />}
            {overview.data && (
              <>
                <GradientStatCard
                  title="Pods Running"
                  value={`${overview.data.runningPods}/${overview.data.totalPods}`}
                  subtitle={`${overview.data.notReadyPods} not ready · ${overview.data.failedPods} failed`}
                  gradientColors={gradients.blue}
                />
                <View style={styles.statRow}>
                  <StatBubble icon="checkmark-circle" color={colors.healthy} value={overview.data.runningPods} label="Running" />
                  <StatBubble icon="alert-circle" color={colors.degraded} value={overview.data.notReadyPods} label="Not Ready" />
                  <StatBubble icon="close-circle" color={colors.down} value={overview.data.failedPods} label="Failed" />
                </View>
              </>
            )}
            <Text style={styles.sectionTitle}>ns-onprem-apps</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState message="No pods found." />}
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
  statRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
