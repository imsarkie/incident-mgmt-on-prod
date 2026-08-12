import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { colors, spacing } from "../constants/theme";
import type { PodIncident } from "../types/k8s";

interface PodIncidentCardProps {
  incident: PodIncident;
  onPress: (incident: PodIncident) => void;
}

export function PodIncidentCard({ incident, onPress }: PodIncidentCardProps) {
  return (
    <Pressable
      onPress={() => onPress(incident)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {incident.title}
        </Text>
        <StatusBadge label={incident.severity} tone={incident.severity} />
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {incident.message}
      </Text>
      <Text style={styles.pod}>
        {incident.namespace}/{incident.podName}
      </Text>
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
    gap: spacing.xs,
  },
  cardPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
  },
  pod: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
