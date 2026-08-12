import type { Incident, Service } from "./domain";

export type IncidentWebSocketEvent =
  | { type: "connected"; payload: { message: string } }
  | { type: "ping"; payload: null }
  | { type: "incident_created"; payload: Incident }
  | { type: "incident_updated"; payload: Incident }
  | { type: "incident_resolved"; payload: Incident }
  | { type: "service_status_changed"; payload: Service };

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";
