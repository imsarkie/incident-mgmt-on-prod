import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { colors, spacing } from "../constants/theme";
import type { Incident } from "../types/domain";

interface IncidentCardProps {
  incident: Incident;
  onPress: (incident: Incident) => void;
}

export function IncidentCard({ incident, onPress }: IncidentCardProps) {
  return (
    <Pressable
      onPress={() => onPress(incident)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{incident.title}</Text>
        <StatusBadge label={incident.severity} tone={incident.severity} />
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {incident.description}
      </Text>
      <StatusBadge label={incident.status} tone={incident.status} />
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
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
