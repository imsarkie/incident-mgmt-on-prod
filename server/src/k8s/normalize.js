import { parseCpuMillicores, parseMemoryBytes } from "./quantity.js";

function normalizeContainerState(status) {
  const state = status.state ?? {};
  const [phase] = Object.keys(state); // "running" | "waiting" | "terminated"
  const detail = phase ? state[phase] : null;

  return {
    name: status.name,
    ready: Boolean(status.ready),
    restartCount: status.restartCount ?? 0,
    state: phase ?? "unknown",
    reason: detail?.reason ?? null,
    lastTerminationReason: status.lastState?.terminated?.reason ?? null,
  };
}

/** Raw K8s Pod object -> our own flat shape. See docs/41-kubernetes-api-contract.md. */
export function normalizePod(rawPod, metricsByContainer = {}) {
  const containerStatuses = rawPod.status?.containerStatuses ?? [];
  const containers = containerStatuses.map(normalizeContainerState);

  const readyContainers = containers.filter((c) => c.ready).length;
  const restartCount = containers.reduce((sum, c) => sum + c.restartCount, 0);

  let cpuMillicores = null;
  let memoryBytes = null;
  if (Object.keys(metricsByContainer).length > 0) {
    cpuMillicores = 0;
    memoryBytes = 0;
    for (const usage of Object.values(metricsByContainer)) {
      cpuMillicores += usage.cpuMillicores;
      memoryBytes += usage.memoryBytes;
    }
  }

  // Limits (if the workload defines them) are what "high usage" gets measured against —
  // a raw millicore/byte number means nothing on its own across differently-sized pods.
  const specContainers = rawPod.spec?.containers ?? [];
  let cpuLimitMillicores = null;
  let memoryLimitBytes = null;
  for (const c of specContainers) {
    const limits = c.resources?.limits;
    if (limits?.cpu) cpuLimitMillicores = (cpuLimitMillicores ?? 0) + parseCpuMillicores(limits.cpu);
    if (limits?.memory) memoryLimitBytes = (memoryLimitBytes ?? 0) + parseMemoryBytes(limits.memory);
  }

  return {
    namespace: rawPod.metadata.namespace,
    name: rawPod.metadata.name,
    status: rawPod.status?.phase ?? "Unknown",
    ready: containers.length > 0 && readyContainers === containers.length,
    readyContainers,
    totalContainers: containers.length,
    restartCount,
    createdAt: rawPod.metadata.creationTimestamp ?? null,
    node: rawPod.spec?.nodeName ?? null,
    podIP: rawPod.status?.podIP ?? null,
    labels: rawPod.metadata.labels ?? {},
    containers,
    cpuMillicores,
    memoryBytes,
    cpuLimitMillicores,
    memoryLimitBytes,
  };
}

/** Normalizes a whole raw Pod list, attaching per-pod metrics (if available) by namespace/name. */
export function normalizePods(rawPodList, metricsByPod = new Map()) {
  return (rawPodList.items ?? []).map((rawPod) => {
    const key = `${rawPod.metadata.namespace}/${rawPod.metadata.name}`;
    return normalizePod(rawPod, metricsByPod.get(key) ?? {});
  });
}

/** Raw metrics.k8s.io PodMetrics -> { [containerName]: { cpuMillicores, memoryBytes } } keyed per pod. */
export function normalizePodMetrics(rawMetricsList) {
  const byPod = new Map();
  for (const item of rawMetricsList.items ?? []) {
    const key = `${item.metadata.namespace}/${item.metadata.name}`;
    const byContainer = {};
    for (const c of item.containers ?? []) {
      byContainer[c.name] = {
        cpuMillicores: parseCpuMillicores(c.usage?.cpu),
        memoryBytes: parseMemoryBytes(c.usage?.memory),
      };
    }
    byPod.set(key, byContainer);
  }
  return byPod;
}

/** Raw K8s core/v1 Event -> our own flat shape. */
export function normalizeEvent(rawEvent) {
  return {
    id: rawEvent.metadata?.uid ?? `${rawEvent.metadata?.namespace}/${rawEvent.metadata?.name}`,
    type: rawEvent.type ?? "Normal",
    reason: rawEvent.reason ?? "",
    message: rawEvent.message ?? "",
    involvedObject: {
      kind: rawEvent.involvedObject?.kind ?? "",
      name: rawEvent.involvedObject?.name ?? "",
      namespace: rawEvent.involvedObject?.namespace ?? "",
    },
    count: rawEvent.count ?? 1,
    firstSeen: rawEvent.firstTimestamp ?? rawEvent.eventTime ?? null,
    lastSeen: rawEvent.lastTimestamp ?? rawEvent.eventTime ?? null,
  };
}

export function computeOverview(namespace, pods, incidents) {
  const runningPods = pods.filter((p) => p.status === "Running").length;
  const notReadyPods = pods.filter((p) => !p.ready).length;
  const failedPods = pods.filter((p) => p.status === "Failed").length;
  const totalRestarts = pods.reduce((sum, p) => sum + p.restartCount, 0);
  const active = incidents.filter((i) => i.status === "active");

  return {
    namespace,
    totalPods: pods.length,
    runningPods,
    notReadyPods,
    failedPods,
    totalRestarts,
    activeIncidents: active.length,
    criticalIncidents: active.filter((i) => i.severity === "critical").length,
    highIncidents: active.filter((i) => i.severity === "high").length,
    mediumIncidents: active.filter((i) => i.severity === "medium").length,
    generatedAt: new Date().toISOString(),
  };
}
