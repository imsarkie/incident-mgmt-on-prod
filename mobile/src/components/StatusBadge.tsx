import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

type BadgeTone = keyof typeof colors;

interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const dotColor = colors[tone];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "capitalize",
  },
});
