import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { colors, spacing } from "../constants/theme";
import { formatAge, formatBytes, formatMillicores } from "../utils/format";
import { podStatusTone } from "../utils/podStatus";
import type { Pod } from "../types/k8s";

interface PodCardProps {
  pod: Pod;
  onPress: (pod: Pod) => void;
}

export function PodCard({ pod, onPress }: PodCardProps) {
  const { label, tone } = podStatusTone(pod);

  return (
    <Pressable
      onPress={() => onPress(pod)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {pod.name}
        </Text>
        <StatusBadge label={label} tone={tone} />
      </View>
      <Text style={styles.namespace}>{pod.namespace}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          {pod.readyContainers}/{pod.totalContainers} ready
        </Text>
        <Text style={styles.stat}>{pod.restartCount} restarts</Text>
        <Text style={styles.stat}>{formatAge(pod.createdAt)} old</Text>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>CPU {formatMillicores(pod.cpuMillicores)}</Text>
        <Text style={styles.stat}>Mem {formatBytes(pod.memoryBytes)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  namespace: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 2,
  },
  stat: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
