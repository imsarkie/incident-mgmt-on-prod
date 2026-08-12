import { useAsync } from "./useAsync";
import { getPodLogs } from "../services/k8sApi";

// No cacheKey: logs are large, ephemeral, and not meaningful to show stale from disk.
export function usePodLogs(namespace: string, name: string) {
  return useAsync((signal) => getPodLogs(namespace, name, 200, signal), [namespace, name]);
}
