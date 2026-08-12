import { StyleSheet, Text, View } from "react-native";
import { useConnection } from "../context/ConnectionContext";
import { colors, spacing } from "../constants/theme";
import type { ConnectionState } from "../types/websocket";

const LABEL: Record<ConnectionState, string> = {
  connected: "● LIVE",
  connecting: "○ CONNECTING",
  reconnecting: "↻ RECONNECTING",
  disconnected: "○ DISCONNECTED",
  error: "○ DISCONNECTED",
};

const TONE: Record<ConnectionState, string> = {
  connected: colors.healthy,
  connecting: colors.textMuted,
  reconnecting: colors.degraded,
  disconnected: colors.textMuted,
  error: colors.down,
};

export function ConnectionIndicator() {
  const { connectionState } = useConnection();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: TONE[connectionState] }]}>{LABEL[connectionState]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
