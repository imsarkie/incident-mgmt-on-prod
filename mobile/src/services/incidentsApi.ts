import { apiFetch } from "./api";
import type { Incident, TimelineEvent } from "../types/domain";

export function getIncidents(signal?: AbortSignal): Promise<Incident[]> {
  return apiFetch<Incident[]>("/api/incidents", { signal });
}

export function getIncidentById(id: string, signal?: AbortSignal): Promise<Incident> {
  return apiFetch<Incident>(`/api/incidents/${id}`, { signal });
}

export function getIncidentTimeline(id: string, signal?: AbortSignal): Promise<TimelineEvent[]> {
  return apiFetch<TimelineEvent[]>(`/api/incidents/${id}/timeline`, { signal });
}
