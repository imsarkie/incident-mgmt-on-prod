import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "../components/StatusBadge";
import { ErrorState, LoadingState } from "../components/RequestState";
import { usePodDetail } from "../hooks/usePods";
import { usePodLogs } from "../hooks/usePodLogs";
import { colors, spacing } from "../constants/theme";
import { formatAge, formatBytes, formatMillicores } from "../utils/format";
import { podStatusTone } from "../utils/podStatus";
import type { RootStackScreenProps } from "../navigation/types";

export function PodDetailScreen({ route }: RootStackScreenProps<"PodDetail">) {
  const { namespace, name } = route.params;
  const { data: pod, error, isLoading, refetch } = usePodDetail(namespace, name);
  const logs = usePodLogs(namespace, name);

  if (isLoading) return <LoadingState label="Loading pod…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!pod) return null;

  const { label, tone } = podStatusTone(pod);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{pod.name}</Text>
        <StatusBadge label={label} tone={tone} />
      </View>
      <Text style={styles.namespace}>{pod.namespace}</Text>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Ready</Text>
        <Text style={styles.statValue}>
          {pod.readyContainers}/{pod.totalContainers}
        </Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Restarts</Text>
        <Text style={styles.statValue}>{pod.restartCount}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Age</Text>
        <Text style={styles.statValue}>{formatAge(pod.createdAt)}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Node</Text>
        <Text style={styles.statValue}>{pod.node ?? "—"}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Pod IP</Text>
        <Text style={styles.statValue}>{pod.podIP ?? "—"}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>CPU</Text>
        <Text style={styles.statValue}>
          {formatMillicores(pod.cpuMillicores)}
          {pod.cpuLimitMillicores ? ` / ${formatMillicores(pod.cpuLimitMillicores)} limit` : ""}
        </Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Memory</Text>
        <Text style={styles.statValue}>
          {formatBytes(pod.memoryBytes)}
          {pod.memoryLimitBytes ? ` / ${formatBytes(pod.memoryLimitBytes)} limit` : ""}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Containers</Text>
      {pod.containers.map((c) => (
        <View key={c.name} style={styles.containerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.containerName}>{c.name}</Text>
            <StatusBadge label={c.state} tone={c.ready ? "healthy" : "degraded"} />
          </View>
          <Text style={styles.containerDetail}>Restarts: {c.restartCount}</Text>
          {c.reason && <Text style={styles.containerDetail}>Reason: {c.reason}</Text>}
          {c.lastTerminationReason && (
            <Text style={styles.containerDetail}>Last termination: {c.lastTerminationReason}</Text>
          )}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Logs (last 200 lines)</Text>
      {logs.isLoading && <Text style={styles.logsMuted}>Loading logs…</Text>}
      {logs.error && <Text style={styles.logsMuted}>{logs.error}</Text>}
      {logs.data != null && (
        <View style={styles.logsBox}>
          <Text style={styles.logsText}>{logs.data || "(empty)"}</Text>
        </View>
      )}
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
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  namespace: {
    color: colors.textMuted,
    fontSize: 13,
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
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  containerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  containerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  containerDetail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  logsBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  logsText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: "monospace",
  },
  logsMuted: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
