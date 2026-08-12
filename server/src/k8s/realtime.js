import { watchPods, listPods, listPodMetrics } from "./client.js";
import { normalizePod, normalizePods, normalizePodMetrics } from "./normalize.js";
import { detectPodIncidents, resolveIncidentsForMissingPods, resolveIncidentsForPod } from "./incidents.js";
import { K8S_NAMESPACE } from "./config.js";

const METRICS_POLL_INTERVAL_MS = 30000;
const WATCH_RETRY_DELAY_MS = 5000;

function broadcastIncidentChanges(broadcast, { created, updated, resolved }) {
  for (const incident of created) broadcast("pod_incident_created", incident);
  for (const incident of updated) broadcast("pod_incident_updated", incident);
  for (const incident of resolved) broadcast("pod_incident_resolved", incident);
}

/**
 * Wires the Kubernetes side of the realtime pipeline onto the app's existing WebSocket
 * broadcaster: pod status/lifecycle changes arrive via the K8s watch stream (near-instant,
 * no polling); CPU/memory usage — which the metrics API can't be watched for — is polled
 * on its own timer. Both paths run the same detection rules and broadcast the same event
 * types, documented in docs/41-kubernetes-api-contract.md.
 */
export function startK8sRealtime(broadcast, namespace = K8S_NAMESPACE) {
  function startWatch() {
    watchPods(
      namespace,
      (event) => {
        if (event.type === "ERROR") return;
        const pod = normalizePod(event.object);

        if (event.type === "DELETED") {
          for (const incident of resolveIncidentsForPod(pod.namespace, pod.name)) {
            broadcast("pod_incident_resolved", incident);
          }
          broadcast("pod_deleted", { namespace: pod.namespace, name: pod.name });
          return;
        }

        broadcast("pod_updated", pod);
        broadcastIncidentChanges(broadcast, detectPodIncidents(pod));
      },
      (err) => {
        console.error("[k8s] pod watch error, retrying:", err.message);
        setTimeout(startWatch, WATCH_RETRY_DELAY_MS);
      }
    );
  }
  startWatch();

  setInterval(async () => {
    try {
      const [rawPods, rawMetrics] = await Promise.all([listPods(namespace), listPodMetrics(namespace)]);
      const pods = normalizePods(rawPods, normalizePodMetrics(rawMetrics));

      for (const pod of pods) {
        broadcastIncidentChanges(broadcast, detectPodIncidents(pod));
      }

      const currentKeys = new Set(pods.map((p) => `${p.namespace}/${p.name}`));
      for (const incident of resolveIncidentsForMissingPods(currentKeys)) {
        broadcast("pod_incident_resolved", incident);
      }
    } catch (err) {
      console.error("[k8s] metrics poll failed:", err.message);
    }
  }, METRICS_POLL_INTERVAL_MS);
}
