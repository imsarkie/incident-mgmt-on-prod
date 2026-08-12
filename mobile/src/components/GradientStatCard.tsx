import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../constants/theme";

interface GradientStatCardProps {
  title: string;
  value: string;
  subtitle: string;
  gradientColors: readonly [string, string, ...string[]];
}

export function GradientStatCard({ title, value, subtitle, gradientColors }: GradientStatCardProps) {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: colors.text,
    fontSize: 40,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
});
