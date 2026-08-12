export type ServiceStatus = "healthy" | "degraded" | "down";
export type IncidentSeverity = "minor" | "major" | "critical";
export type IncidentStatus = "active" | "monitoring" | "resolved";

export interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  uptimePercent: number;
  lastCheckedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  message: string;
  status: IncidentStatus;
}
