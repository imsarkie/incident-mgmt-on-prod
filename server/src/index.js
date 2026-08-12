import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import {
  listServices,
  getService,
  listIncidents,
  getIncident,
  getTimeline,
  activeIncidents,
  createIncident,
  updateIncidentStatus,
} from "./data.js";

const PORT = process.env.PORT ?? 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.get("/api/services", (_req, res) => res.json(listServices()));

app.get("/api/services/:id", (req, res) => {
  const service = getService(req.params.id);
  if (!service) return res.status(404).json({ error: "Service not found" });
  res.json(service);
});

app.get("/api/incidents", (req, res) => {
  const onlyActive = req.query.status === "active";
  res.json(onlyActive ? activeIncidents() : listIncidents());
});

app.get("/api/incidents/:id", (req, res) => {
  const incident = getIncident(req.params.id);
  if (!incident) return res.status(404).json({ error: "Incident not found" });
  res.json(incident);
});

app.get("/api/incidents/:id/timeline", (req, res) => {
  const timeline = getTimeline(req.params.id);
  if (!timeline) return res.status(404).json({ error: "Incident not found" });
  res.json(timeline);
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(message);
  }
}

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "connected", payload: { message: "connected to pulse" } }));

  const heartbeat = setInterval(() => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: "ping", payload: null }));
  }, 15000);

  socket.on("close", () => clearInterval(heartbeat));
});

// Simulated incident lifecycle: create, progress, resolve — broadcast each step.
setInterval(() => {
  const active = activeIncidents();
  const shouldCreate = active.length < 3 && Math.random() < 0.5;

  if (shouldCreate) {
    const incident = createIncident();
    broadcast("incident_created", incident);
    broadcast("service_status_changed", getService(incident.serviceId));
    return;
  }

  if (active.length > 0) {
    const incident = active[Math.floor(Math.random() * active.length)];
    const isResolving = Math.random() < 0.4;
    if (isResolving) {
      const updated = updateIncidentStatus(incident.id, "resolved", "Fix deployed — incident resolved.");
      broadcast("incident_resolved", updated);
      broadcast("service_status_changed", getService(updated.serviceId));
    } else {
      const updated = updateIncidentStatus(incident.id, "monitoring", "Mitigation applied — monitoring recovery.");
      broadcast("incident_updated", updated);
    }
  }
}, 8000);

server.listen(PORT, () => {
  console.log(`pulse-server listening on http://localhost:${PORT} (ws at /ws)`);
});
