import type { Pod } from "../types/k8s";
import type { colors } from "../constants/theme";

type Tone = keyof typeof colors;

export function podStatusTone(pod: Pod): { label: string; tone: Tone } {
  if (pod.status === "Failed" || pod.status === "Unknown") return { label: pod.status, tone: "down" };
  if (pod.status === "Running" && !pod.ready) return { label: "Not Ready", tone: "degraded" };
  if (pod.status === "Pending") return { label: "Pending", tone: "degraded" };
  return { label: pod.status, tone: "healthy" };
}
