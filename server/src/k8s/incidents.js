// Simple, in-memory incident detection over normalized pods. No persistence — state
// resets if the process restarts, which is fine for a monitoring layer that re-derives
// everything from the cluster's current state on every check.

const SUSTAINED_THRESHOLD = 3; // consecutive high readings required before flagging MEDIUM
const HIGH_USAGE_RATIO = 0.8; // 80% of the container's own resource limit

const previousRestartCounts = new Map(); // "ns/pod" -> restartCount
const highCpuStreaks = new Map(); // "ns/pod" -> consecutive high-CPU checks
const highMemoryStreaks = new Map(); // "ns/pod" -> consecutive high-memory checks
const activeIncidents = new Map(); // "ns/pod/reason" -> incident

const podKey = (pod) => `${pod.namespace}/${pod.name}`;

function isHighCpu(pod) {
  if (!pod.cpuLimitMillicores || pod.cpuMillicores == null) return false;
  return pod.cpuMillicores / pod.cpuLimitMillicores >= HIGH_USAGE_RATIO;
}

function isHighMemory(pod) {
  if (!pod.memoryLimitBytes || pod.memoryBytes == null) return false;
  return pod.memoryBytes / pod.memoryLimitBytes >= HIGH_USAGE_RATIO;
}

// Pod-watch-triggered detection passes don't carry metrics (metrics come from a separate,
// unwatchable API polled on its own timer — see realtime.js). When metrics are absent for
// this particular call, that means "unknown right now," not "usage just dropped" — so the
// streak must be left untouched rather than reset to 0, or a pod's unrelated status
// changes would keep erasing real, in-progress sustained-usage streaks between polls.
function updateStreak(map, key, isHighNow, hasData) {
  if (!hasData) return map.get(key) ?? 0;
  const next = isHighNow ? (map.get(key) ?? 0) + 1 : 0;
  map.set(key, next);
  return next;
}

function resolveIncident(id) {
  const incident = activeIncidents.get(id);
  if (!incident) return null;
  activeIncidents.delete(id);
  const now = new Date().toISOString();
  return { ...incident, status: "resolved", updatedAt: now, resolvedAt: now };
}

/**
 * Runs every detection rule for one pod. Returns which incidents were newly created,
 * updated (still applicable, e.g. a fresher message), or resolved (no longer applicable)
 * as a result of this pod's current state.
 */
export function detectPodIncidents(pod) {
  const key = podKey(pod);
  const created = [];
  const updated = [];
  const resolved = [];
  const currentReasons = new Set();

  function apply(reason, severity, title, message) {
    currentReasons.add(reason);
    const id = `${key}/${reason}`;
    const now = new Date().toISOString();
    const existing = activeIncidents.get(id);
    if (existing) {
      existing.message = message;
      existing.updatedAt = now;
      updated.push(existing);
    } else {
      const incident = {
        id,
        severity,
        reason,
        title,
        message,
        namespace: pod.namespace,
        podName: pod.name,
        status: "active",
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
      };
      activeIncidents.set(id, incident);
      created.push(incident);
    }
  }

  // CRITICAL
  if (pod.status === "Failed") {
    apply("failed", "critical", `Pod failed: ${pod.name}`, `${pod.name} is in the Failed phase.`);
  }
  for (const c of pod.containers) {
    if (c.reason === "CrashLoopBackOff") {
      apply("crashloopbackoff", "critical", `CrashLoopBackOff: ${pod.name}`, `Container "${c.name}" is crash-looping.`);
    }
    if (c.reason === "ImagePullBackOff" || c.reason === "ErrImagePull") {
      apply("imagepullbackoff", "critical", `ImagePullBackOff: ${pod.name}`, `Container "${c.name}" cannot pull its image.`);
    }
    if (c.lastTerminationReason === "OOMKilled") {
      apply("oomkilled", "critical", `OOMKilled: ${pod.name}`, `Container "${c.name}" was killed for exceeding its memory limit.`);
    }
  }

  // HIGH — not ready
  if (pod.status === "Running" && !pod.ready) {
    apply("not_ready", "high", `Not ready: ${pod.name}`, `${pod.readyContainers}/${pod.totalContainers} containers ready.`);
  }

  // HIGH — restart count increase (a one-shot event, not a persistent condition to resolve later)
  const previousRestarts = previousRestartCounts.get(key);
  if (previousRestarts !== undefined && pod.restartCount > previousRestarts) {
    const now = new Date().toISOString();
    created.push({
      id: `${key}/restart_increase/${now}`,
      severity: "high",
      reason: "restart_increase",
      title: `Restart count increased: ${pod.name}`,
      message: `Restart count went from ${previousRestarts} to ${pod.restartCount}.`,
      namespace: pod.namespace,
      podName: pod.name,
      status: "active",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });
  }
  previousRestartCounts.set(key, pod.restartCount);

  // MEDIUM — sustained (not single-spike) high CPU/memory. Only advances when this call
  // actually carries metrics (see updateStreak's comment) — pod-watch-triggered calls,
  // which have no metrics, leave these streaks exactly as the last metrics poll left them.
  const hasMetrics = pod.cpuMillicores != null;
  const cpuStreak = updateStreak(highCpuStreaks, key, isHighCpu(pod), hasMetrics);
  if (cpuStreak >= SUSTAINED_THRESHOLD) {
    apply(
      "high_cpu",
      "medium",
      `Sustained high CPU: ${pod.name}`,
      `CPU usage has been at or above ${HIGH_USAGE_RATIO * 100}% of its limit for ${cpuStreak} consecutive checks.`
    );
  }
  const memoryStreak = updateStreak(highMemoryStreaks, key, isHighMemory(pod), hasMetrics);
  if (memoryStreak >= SUSTAINED_THRESHOLD) {
    apply(
      "high_memory",
      "medium",
      `Sustained high memory: ${pod.name}`,
      `Memory usage has been at or above ${HIGH_USAGE_RATIO * 100}% of its limit for ${memoryStreak} consecutive checks.`
    );
  }

  // Anything that was active for this pod but no rule matched this time around has cleared.
  for (const [id, incident] of activeIncidents) {
    if (incident.namespace !== pod.namespace || incident.podName !== pod.name) continue;
    if (currentReasons.has(incident.reason)) continue;
    resolved.push(resolveIncident(id));
  }

  return { created, updated, resolved };
}

/** Resolves any tracked incident whose pod is not present in the given "still exists" set. */
export function resolveIncidentsForMissingPods(currentPodKeys) {
  const resolved = [];
  for (const [id, incident] of activeIncidents) {
    if (!currentPodKeys.has(`${incident.namespace}/${incident.podName}`)) {
      resolved.push(resolveIncident(id));
    }
  }
  return resolved;
}

/** Resolves every tracked incident for one specific pod (used when that pod is deleted). */
export function resolveIncidentsForPod(namespace, name) {
  const resolved = [];
  for (const [id, incident] of activeIncidents) {
    if (incident.namespace === namespace && incident.podName === name) {
      resolved.push(resolveIncident(id));
    }
  }
  return resolved;
}

export function getActiveIncidents() {
  return Array.from(activeIncidents.values());
}
