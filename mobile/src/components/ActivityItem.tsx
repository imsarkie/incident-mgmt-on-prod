import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../constants/theme";

interface ActivityItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  message: string;
  timestamp: string;
}

export function ActivityItem({ icon, color, message, timestamp }: ActivityItemProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}26` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.message} numberOfLines={1}>
        {message}
      </Text>
      <Text style={styles.time}>{new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
