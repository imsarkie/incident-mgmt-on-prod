import { apiFetch, apiFetchText } from "./api";
import type { K8sEvent, Overview, Pod, PodIncident } from "../types/k8s";

export function getOverview(signal?: AbortSignal): Promise<Overview> {
  return apiFetch<Overview>("/api/overview", { signal });
}

export function getPods(signal?: AbortSignal): Promise<Pod[]> {
  return apiFetch<Pod[]>("/api/pods", { signal });
}

export function getPodDetail(namespace: string, name: string, signal?: AbortSignal): Promise<Pod> {
  return apiFetch<Pod>(`/api/pods/${namespace}/${name}`, { signal });
}

export function getEvents(signal?: AbortSignal): Promise<K8sEvent[]> {
  return apiFetch<K8sEvent[]>("/api/events", { signal });
}

export function getPodIncidents(signal?: AbortSignal): Promise<PodIncident[]> {
  return apiFetch<PodIncident[]>("/api/pod-incidents", { signal });
}

export function getPodLogs(namespace: string, name: string, tailLines = 200, signal?: AbortSignal): Promise<string> {
  return apiFetchText(`/api/pods/${namespace}/${name}/logs?tailLines=${tailLines}`, { signal });
}
