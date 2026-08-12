import { Router } from "express";
import { listPods, getPod, listEvents, listPodMetrics, getPodLogs } from "./client.js";
import { normalizePod, normalizePods, normalizePodMetrics, normalizeEvent, computeOverview } from "./normalize.js";
import { getActiveIncidents, detectPodIncidents } from "./incidents.js";
import { K8S_NAMESPACE } from "./config.js";

export const k8sRouter = Router();

async function fetchNormalizedPods(namespace) {
  const [rawPods, rawMetrics] = await Promise.allSettled([listPods(namespace), listPodMetrics(namespace)]);
  if (rawPods.status === "rejected") throw rawPods.reason;
  const metricsByPod = rawMetrics.status === "fulfilled" ? normalizePodMetrics(rawMetrics.value) : new Map();
  return normalizePods(rawPods.value, metricsByPod);
}

k8sRouter.get("/api/overview", async (req, res) => {
  try {
    const namespace = req.query.namespace ?? K8S_NAMESPACE;
    const pods = await fetchNormalizedPods(namespace);
    res.json(computeOverview(namespace, pods, getActiveIncidents()));
  } catch (err) {
    res.status(502).json({ error: `Could not reach Kubernetes API: ${err.message}` });
  }
});

// Not in the original spec — added because the client needs a way to fetch the
// *current* incident list on first load; the WebSocket only tells you about changes
// from here on out. Runs a fresh detection pass over live pods so this is always
// accurate to the cluster's current state, not just whatever the watch has seen so far.
k8sRouter.get("/api/pod-incidents", async (req, res) => {
  try {
    const namespace = req.query.namespace ?? K8S_NAMESPACE;
    const pods = await fetchNormalizedPods(namespace);
    for (const pod of pods) detectPodIncidents(pod);
    res.json(getActiveIncidents());
  } catch (err) {
    res.status(502).json({ error: `Could not reach Kubernetes API: ${err.message}` });
  }
});

k8sRouter.get("/api/pods", async (req, res) => {
  try {
    const namespace = req.query.namespace ?? K8S_NAMESPACE;
    res.json(await fetchNormalizedPods(namespace));
  } catch (err) {
    res.status(502).json({ error: `Could not reach Kubernetes API: ${err.message}` });
  }
});

k8sRouter.get("/api/pods/:namespace/:name", async (req, res) => {
  const { namespace, name } = req.params;
  try {
    const [rawPod, rawMetrics] = await Promise.allSettled([getPod(namespace, name), listPodMetrics(namespace)]);
    if (rawPod.status === "rejected") throw rawPod.reason;
    const metricsByPod = rawMetrics.status === "fulfilled" ? normalizePodMetrics(rawMetrics.value) : new Map();
    res.json(normalizePod(rawPod.value, metricsByPod.get(`${namespace}/${name}`) ?? {}));
  } catch (err) {
    res.status(404).json({ error: `Pod not found or unreachable: ${err.message}` });
  }
});

k8sRouter.get("/api/events", async (req, res) => {
  try {
    const namespace = req.query.namespace ?? K8S_NAMESPACE;
    const rawEvents = await listEvents(namespace);
    const events = (rawEvents.items ?? [])
      .map(normalizeEvent)
      .sort((a, b) => (b.lastSeen ?? "").localeCompare(a.lastSeen ?? ""));
    res.json(events);
  } catch (err) {
    res.status(502).json({ error: `Could not reach Kubernetes API: ${err.message}` });
  }
});

k8sRouter.get("/api/pods/:namespace/:name/logs", async (req, res) => {
  const { namespace, name } = req.params;
  const { container, tailLines } = req.query;
  try {
    const logs = await getPodLogs(namespace, name, {
      container,
      tailLines: tailLines ? Number(tailLines) : undefined,
    });
    res.type("text/plain").send(logs);
  } catch (err) {
    res.status(404).json({ error: `Could not fetch logs: ${err.message}` });
  }
});
