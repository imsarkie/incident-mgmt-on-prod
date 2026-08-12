import http from "node:http";
import { K8S_PROXY_URL, K8S_NAMESPACE } from "./config.js";

// Every function here does a plain, read-only HTTP GET against the local `kubectl proxy`
// (see docs/40-kubernetes-monitoring.md for how that proxy/tunnel gets started). Nothing
// in this file ever issues a write (POST/PUT/PATCH/DELETE) — that's a deliberate,
// load-bearing constraint, not an oversight.

async function fetchJson(path) {
  const res = await fetch(`${K8S_PROXY_URL}${path}`);
  if (!res.ok) throw new Error(`K8s API GET ${path} failed: ${res.status}`);
  return res.json();
}

async function fetchText(path) {
  const res = await fetch(`${K8S_PROXY_URL}${path}`);
  if (!res.ok) throw new Error(`K8s API GET ${path} failed: ${res.status}`);
  return res.text();
}

export function listPods(namespace = K8S_NAMESPACE) {
  return fetchJson(`/api/v1/namespaces/${namespace}/pods`);
}

export function getPod(namespace, name) {
  return fetchJson(`/api/v1/namespaces/${namespace}/pods/${name}`);
}

export function listEvents(namespace = K8S_NAMESPACE) {
  return fetchJson(`/api/v1/namespaces/${namespace}/events`);
}

export function listPodMetrics(namespace = K8S_NAMESPACE) {
  return fetchJson(`/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods`);
}

export function getPodLogs(namespace, name, { container, tailLines = 200 } = {}) {
  const params = new URLSearchParams({ tailLines: String(tailLines) });
  if (container) params.set("container", container);
  return fetchText(`/api/v1/namespaces/${namespace}/pods/${name}/log?${params}`);
}

/**
 * Streams the Kubernetes watch feed for pods in a namespace — a long-lived HTTP
 * connection where the API server pushes one JSON object per line as pods change
 * (ADDED/MODIFIED/DELETED), instead of us polling. `onEvent` is called once per line.
 * Returns an unsubscribe function.
 */
export function watchPods(namespace = K8S_NAMESPACE, onEvent, onError) {
  const url = new URL(`${K8S_PROXY_URL}/api/v1/namespaces/${namespace}/pods?watch=1`);

  const req = http.get(url, (res) => {
    if (res.statusCode !== 200) {
      onError?.(new Error(`watch failed with status ${res.statusCode}`));
      return;
    }

    let buffer = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      buffer += chunk;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        try {
          onEvent(JSON.parse(line));
        } catch {
          // Malformed/partial line — skip it rather than crash the watch.
        }
      }
    });
    res.on("end", () => onError?.(new Error("watch stream ended")));
    res.on("error", (err) => onError?.(err));
  });

  req.on("error", (err) => onError?.(err));

  return () => req.destroy();
}
