import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { colors, spacing } from "../constants/theme";
import type { Service } from "../types/domain";

interface ServiceCardProps {
  service: Service;
  onPress: (service: Service) => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  return (
    <Pressable
      onPress={() => onPress(service)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{service.name}</Text>
        <StatusBadge label={service.status} tone={service.status} />
      </View>
      <Text style={styles.description}>{service.description}</Text>
      <Text style={styles.uptime}>{service.uptimePercent}% uptime</Text>
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
  },
  cardPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  uptime: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
