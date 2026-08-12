import { useAsync } from "./useAsync";
import { getPodIncidents } from "../services/k8sApi";

export function usePodIncidents() {
  return useAsync(getPodIncidents, [], "pod-incidents");
}
