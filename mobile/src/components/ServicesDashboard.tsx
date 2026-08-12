import { StyleSheet, Text, View } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import { GradientStatCard } from "./GradientStatCard";
import { StatBubble } from "./StatBubble";
import { ActivityItem } from "./ActivityItem";
import { colors, gradients, spacing } from "../constants/theme";
import type { Service } from "../types/domain";

export interface ActivityEntry {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  message: string;
  timestamp: string;
}

interface ServicesDashboardProps {
  services: Service[];
  recentActivity: ActivityEntry[];
}

export function ServicesDashboard({ services, recentActivity }: ServicesDashboardProps) {
  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  const downCount = services.filter((s) => s.status === "down").length;
  const total = services.length;
  const healthPercent = total === 0 ? 100 : Math.round((healthyCount / total) * 100);

  return (
    <View>
      <GradientStatCard
        title="System Health"
        value={`${healthPercent}%`}
        subtitle={total === 0 ? "No services reporting" : `${healthyCount} of ${total} services healthy`}
        gradientColors={gradients.purple}
      />

      <View style={styles.statRow}>
        <StatBubble icon="checkmark-circle" color={colors.healthy} value={healthyCount} label="Healthy" />
        <StatBubble icon="alert-circle" color={colors.degraded} value={degradedCount} label="Degraded" />
        <StatBubble icon="close-circle" color={colors.down} value={downCount} label="Down" />
      </View>

      {recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((entry) => (
            <ActivityItem
              key={entry.id}
              icon={entry.icon}
              color={entry.color}
              message={entry.message}
              timestamp={entry.timestamp}
            />
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.standaloneTitle]}>All Services</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  activitySection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  standaloneTitle: {
    paddingHorizontal: spacing.md,
  },
});
