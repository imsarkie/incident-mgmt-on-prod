import { randomUUID } from "node:crypto";

const SERVICE_DEFS = [
  { id: "api-gateway", name: "API Gateway", description: "Edge routing and rate limiting" },
  { id: "auth-service", name: "Auth Service", description: "Login, sessions, token issuance" },
  { id: "payment-service", name: "Payment Service", description: "Card processing and payouts" },
  { id: "notification-service", name: "Notification Service", description: "Push, email, SMS delivery" },
  { id: "database", name: "Database", description: "Primary relational datastore" },
  { id: "redis-cache", name: "Redis Cache", description: "Hot-path caching layer" },
];

const INCIDENT_TEMPLATES = [
  { title: "Elevated latency", severityPool: ["minor", "major"] },
  { title: "Increased error rate", severityPool: ["major", "critical"] },
  { title: "Partial outage", severityPool: ["critical"] },
  { title: "Connection pool exhaustion", severityPool: ["major"] },
  { title: "Degraded throughput", severityPool: ["minor", "major"] },
];

const now = () => new Date().toISOString();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const services = new Map(
  SERVICE_DEFS.map((def) => [
    def.id,
    {
      ...def,
      status: "healthy",
      uptimePercent: 99.9,
      lastCheckedAt: now(),
    },
  ])
);

export const incidents = new Map();
export const timelines = new Map(); // incidentId -> array of events

export function listServices() {
  return Array.from(services.values());
}

export function getService(id) {
  return services.get(id) ?? null;
}

export function listIncidents() {
  return Array.from(incidents.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getIncident(id) {
  return incidents.get(id) ?? null;
}

export function getTimeline(incidentId) {
  return timelines.get(incidentId) ?? null;
}

function addTimelineEvent(incidentId, message, status) {
  const event = { id: randomUUID(), incidentId, timestamp: now(), message, status };
  const events = timelines.get(incidentId) ?? [];
  events.push(event);
  timelines.set(incidentId, events);
  return event;
}

export function setServiceStatus(id, status) {
  const service = services.get(id);
  if (!service) return null;
  service.status = status;
  service.lastCheckedAt = now();
  return service;
}

export function createIncident() {
  const template = pick(INCIDENT_TEMPLATES);
  const service = pick(Array.from(services.values()));
  const severity = pick(template.severityPool);
  const id = randomUUID();
  const incident = {
    id,
    title: `${template.title}: ${service.name}`,
    description: `${template.title} detected on ${service.name}. Investigating root cause.`,
    severity,
    status: "active",
    serviceId: service.id,
    createdAt: now(),
    updatedAt: now(),
    resolvedAt: null,
  };
  incidents.set(id, incident);
  addTimelineEvent(id, "Incident created — investigating.", "active");
  setServiceStatus(service.id, severity === "critical" ? "down" : "degraded");
  return incident;
}

export function updateIncidentStatus(id, status, message) {
  const incident = incidents.get(id);
  if (!incident) return null;
  incident.status = status;
  incident.updatedAt = now();
  if (status === "resolved") {
    incident.resolvedAt = now();
    setServiceStatus(incident.serviceId, "healthy");
  }
  addTimelineEvent(id, message, status);
  return incident;
}

export function activeIncidents() {
  return listIncidents().filter((incident) => incident.status !== "resolved");
}
