import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../constants/theme";

interface StatBubbleProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}

export function StatBubble({ icon, color, value, label }: StatBubbleProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: `${color}26` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
