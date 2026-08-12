import { useAsync } from "./useAsync";
import { getIncidentById, getIncidents, getIncidentTimeline } from "../services/incidentsApi";

export function useIncidents() {
  return useAsync(getIncidents, [], "incidents");
}

export function useIncidentDetail(id: string) {
  return useAsync((signal) => getIncidentById(id, signal), [id], `incident:${id}`);
}

export function useIncidentTimeline(id: string) {
  return useAsync((signal) => getIncidentTimeline(id, signal), [id], `timeline:${id}`);
}
