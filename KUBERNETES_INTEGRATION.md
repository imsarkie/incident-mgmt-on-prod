# Kubernetes Integration Journal

This is a detailed record of evolving Pulse from a fictional incident simulator into a
**read-only** monitor of a real production MicroK8s cluster — every step, every file,
every decision, and every bug found along the way. Unlike `docs/40-41`, which are
deliberately terse React-Native-only references, this file is the full story.

> Server host/port/username are written as placeholders (`<server-host>`,
> `<ssh-port>`, `<ssh-user>`) throughout — the real values were used during the actual
> session, but this file lives in git history, and there's no need to bake a real
> production server's address into a committed document permanently. The SSH **password**
> was never known to this codebase at any point; it's typed manually by whoever opens
> the tunnel.

---

## 1. The goal

Turn Pulse from a demo app backed by an in-memory fake-data generator into something
that shows **real signal from a real cluster** — while treating the production
environment as something to be observed, never touched:

- No pod stop/delete/restart/scale.
- No manifest apply, no patch, no exec into a container.
- No install of anything on the production server.
- No SSH password, and no Kubernetes credential of any kind, ever stored in this
  codebase or sent to the mobile app.

Everything below was built and tested against a real cluster to confirm it actually
works — not just "should work."

## 2. The production environment

- **OS**: Debian
- **Kubernetes**: MicroK8s, with `metrics-server` already enabled (needed for CPU/memory
  usage — we didn't install anything to get it).
- **Namespace monitored**: `ns-onprem-apps` — a real namespace with ~34 running
  application pods (`cob-be`, `cob-fe`, `incident-be`, `itsm-be`, `kafka-be`,
  `workflow-admin-be`, and more — a real internal platform, not a toy).
- **Access**: SSH to the server, from which `microk8s kubectl` is available.

## 3. Why the connection is shaped the way it is

```
React Native  →  Node.js backend (Pulse's own server)  →  Kubernetes API  →  MicroK8s
                                                            (via a local proxy,
                                                             reached over SSH tunnel)
```

Two constraints shaped this, both explicit from the start:

1. **The backend must not use SSH for every API call.** Shelling out to `ssh ... kubectl
   get pods` on every request would be slow, fragile, and awkward to parse. Instead, the
   Kubernetes API itself is reached over plain HTTP, via `kubectl proxy` — a standard
   Kubernetes tool that runs a local HTTP server which forwards requests to the real API
   server, handling authentication itself using the operator's kubeconfig.
2. **The Kubernetes API must not be exposed publicly.** `kubectl proxy` binds to
   `127.0.0.1` only, on the server. To reach it from a development machine, an SSH tunnel
   forwards a local port to that same loopback address on the server — the same
   `-L` port-forwarding SSH has always supported, nothing exotic.

The result: the Node.js backend only ever does `fetch("http://localhost:8001/...")`. It
has no idea an SSH tunnel exists. It has no Kubernetes credentials of its own — the proxy
supplies those, entirely on the server side.

## 4. Starting the tunnel (manual, every time — never automated)

Two long-lived terminal sessions, on two different machines. Neither is ever started
programmatically by this codebase — that was an explicit requirement, and it stayed that
way through the whole implementation.

**On the production server** (after `ssh <ssh-user>@<server-host> -p <ssh-port>`):
```bash
microk8s kubectl proxy --address=127.0.0.1 --port=8001
```

**On the local development machine:**
```bash
ssh -L 8001:127.0.0.1:8001 <ssh-user>@<server-host> -p <ssh-port>
```

Once both are running, `http://localhost:8001` on the local machine reaches the real
cluster's API server. The Node backend was written to tolerate this tunnel *not* being up
yet — see §8.

## 5. The backend integration layer, file by file

All of this lives under `server/src/k8s/`, added **alongside** the original fictional
simulator (`server/src/data.js`), which was left completely untouched. Nothing about the
old `/api/services`/`/api/incidents` endpoints changed.

### `config.js`
Two values, both overridable by environment variable, neither a secret:
```js
export const K8S_PROXY_URL = process.env.K8S_PROXY_URL ?? "http://127.0.0.1:8001";
export const K8S_NAMESPACE = process.env.K8S_NAMESPACE ?? "ns-onprem-apps";
```

### `quantity.js`
Kubernetes reports CPU and memory as strings with unit suffixes — `"100m"` (100
millicores), `"23153742n"` (nanocores), `"128Mi"` (mebibytes). This file parses those
suffixes (`n`, `u`, `m`, `k`, `M`, `G`, `Ki`, `Mi`, `Gi`, `Ti`) into plain numbers, so
nothing downstream has to think about Kubernetes' unit conventions.

### `client.js`
The only file that actually talks to the Kubernetes API. Every function is a read-only
HTTP `GET` against the local proxy:
- `listPods(namespace)`, `getPod(namespace, name)` — core `/api/v1/.../pods` endpoints.
- `listEvents(namespace)` — core `/api/v1/.../events`.
- `listPodMetrics(namespace)` — the metrics aggregation API,
  `/apis/metrics.k8s.io/v1beta1/.../pods`.
- `getPodLogs(namespace, name, opts)` — plain-text log output, not JSON.
- `watchPods(namespace, onEvent, onError)` — a **streaming** connection. Rather than
  polling "did anything change?" repeatedly, this opens one long-lived HTTP request with
  `?watch=1` and the API server pushes one JSON line per change (pod added, modified,
  deleted) for as long as the connection stays open. Implemented with Node's built-in
  `http` module reading the response as a stream, buffering partial lines until a full
  JSON object is available. Returns an unsubscribe function.

Nothing in this file can issue a write. There's no `POST`/`PUT`/`PATCH`/`DELETE` call
anywhere in it — that's a structural guarantee, not just current behavior.

### `normalize.js`
Converts raw Kubernetes API objects into Pulse's own flat shapes — `Pod`,
`ContainerState`, `K8sEvent`, `Overview` — documented in full in
`docs/41-kubernetes-api-contract.md`. React Native never sees a raw Kubernetes object.
Notably, this is also where a pod's **resource limits** get extracted from
`spec.containers[].resources.limits` — needed later for incident detection (§6).

### `incidents.js`
The detection engine — covered in detail in §6, since it's the most interesting/subtle
part of this whole effort.

### `routes.js`
The Express router exposing:
- `GET /api/overview`
- `GET /api/pods`
- `GET /api/pods/:namespace/:name`
- `GET /api/events`
- `GET /api/pods/:namespace/:name/logs`
- `GET /api/pod-incidents` — **added mid-session**, not in the original spec (see §9).

### `realtime.js`
Wires the Kubernetes side onto Pulse's *existing* WebSocket broadcaster (the same `wss`
already used for the fictional simulator's events) — two independent feeds:
- The **pod watch stream** drives instant detection of status/lifecycle changes
  (CrashLoopBackOff, not-ready, restart increases) the moment they happen.
- A **30-second timer** polls the metrics API separately, because `metrics.k8s.io`
  doesn't support the watch mechanism at all — CPU/memory usage has to be polled,
  full stop.

Both paths run the same detection rules and broadcast through the same WebSocket
connection.

## 6. Incident detection — the rules, and the reasoning behind each one

| Severity | Reason | Condition |
|---|---|---|
| critical | `failed` | Pod phase is `Failed` |
| critical | `crashloopbackoff` | Container waiting with reason `CrashLoopBackOff` |
| critical | `imagepullbackoff` | Container waiting with reason `ImagePullBackOff`/`ErrImagePull` |
| critical | `oomkilled` | Container's previous run terminated with reason `OOMKilled` |
| high | `not_ready` | Pod is `Running` but not all containers are ready |
| high | `restart_increase` | A container's restart count went up since the last check |
| medium | `high_cpu` | CPU ≥ 80% of the pod's own limit, **3 consecutive checks in a row** |
| medium | `high_memory` | Memory ≥ 80% of the pod's own limit, **3 consecutive checks in a row** |

Design choices worth spelling out:

- **CPU/memory require *sustained* high usage, not a single spike** — an explicit
  requirement from the start. This is tracked with a per-pod streak counter
  (`highCpuStreaks`/`highMemoryStreaks`, in-memory `Map`s) that increments on a high
  reading and resets to zero on a normal one. Only once the streak reaches 3 does the
  MEDIUM incident fire.
- **`restart_increase` is a one-shot event, not a persistent condition.** Every other
  reason follows a normal active → resolved lifecycle (re-evaluated on every pod update;
  clears automatically once it stops applying). A restart *increase* isn't really an
  ongoing "condition" in the same sense — it's a moment in time. So it's fired once, with
  a timestamp baked into its `id`, and never gets a matching `resolved` event.
- **A pod with no resource limit configured can never trigger `high_cpu`/`high_memory`.**
  There's nothing to measure "80% of" without a limit. This turned out to matter a lot in
  practice — see the finding in §8.

## 7. Testing against the real cluster

Once the tunnel was confirmed live (`curl http://localhost:8001/version` returning real
cluster version info — Kubernetes v1.35.6), every endpoint was tested against production
directly, not mocked:

| Test | Result |
|---|---|
| `GET /api/overview` | `200` — 34 pods, all `Running`, 928 total restarts across the namespace |
| `GET /api/pods` | `200` — all 34 real pods, correctly normalized (names, restart counts, node placement, labels, container states) |
| `GET /api/pods/:namespace/:name` | `200` for a real pod; `404` with a clear message for a nonexistent one |
| `GET /api/events` | `200`, empty array — cross-checked directly against the raw Kubernetes events API to confirm it was genuinely empty, not a bug |
| `GET /api/pods/.../logs` | `200`, real Spring Boot log output (including live Hibernate SQL query logs) pulled from `analyticstoken-be` |
| Metrics API | Reachable — **34 of 34 pods** returned live CPU/memory usage |

Also verified: the backend survives the tunnel *not* being up. Before the tunnel was
started, every Kubernetes-backed endpoint correctly returned `502` with a clear error
message, the pod watch logged a connection error and quietly retried every 5 seconds, the
metrics poll logged a failure and retried on its next tick — and the whole process never
crashed. The moment the tunnel came up, everything started working without restarting the
Node process.

## 8. What testing actually revealed

**Zero of the 34 pods in `ns-onprem-apps` have CPU or memory limits configured.** This
means the `high_cpu`/`high_memory` MEDIUM rules — built and working exactly as
specified — currently have nothing to ever fire against in this namespace. Not a bug:
an honest reflection of how the workloads are actually configured. It does mean that
rule is effectively dormant right now, and would need either (a) limits added to the
workloads, or (b) a fallback absolute-usage threshold for pods without limits, to ever
produce a MEDIUM incident here. Flagged for a future decision, not fixed silently.

Also observed, not an incident by the current rules but worth knowing: `cobimport-be` has
the highest restart count in the namespace at the time of testing (50).

## 9. Filling one real gap: `GET /api/pod-incidents`

The original endpoint list didn't include a way to fetch the *current* list of active
incidents — only the realtime WebSocket events (`pod_incident_created` etc.) for changes
going forward. That's fine for a client that's already running, but useless on first
launch: there'd be no way to know what's *already* wrong when the app opens. Added this
endpoint mid-session once wiring up the mobile app made the gap obvious. It runs a fresh
detection pass over the live pod list on every call (same pattern as `/api/overview`),
so it's always accurate to the cluster's current state — not dependent on how long the
watch stream happens to have been running.

## 10. Wiring it into React Native

With the backend verified against real data, the mobile app was updated to consume it —
new code added, existing patterns reused, nothing rebuilt from scratch:

**New:**
- `types/k8s.ts` — `Pod`, `ContainerState`, `K8sEvent`, `Overview`, `PodIncident`,
  mirroring the backend contract exactly.
- `services/k8sApi.ts` — one function per endpoint. Needed one addition to the shared API
  layer (`apiFetchText`) since the logs endpoint returns plain text, not JSON, and the
  existing `apiFetch` always called `response.json()`.
- `hooks/usePods.ts`, `useOverview.ts`, `usePodIncidents.ts`, `usePodLogs.ts` — every one
  of these is a thin wrapper around the *existing* `useAsync` hook, which means they get
  cancellation, offline caching, and pull-to-refresh for free, with zero new logic.
- `components/PodCard.tsx`, `PodIncidentCard.tsx` — new presentational components
  matching the app's existing visual style.
- `screens/PodsScreen.tsx`, `PodIncidentsScreen.tsx`, `PodDetailScreen.tsx` — the real
  screens, following the exact same loading/error/empty/cache-notice pattern already
  established by every other screen in the app.
- `utils/format.ts`, `utils/podStatus.ts` — small formatting helpers (CPU/memory
  units, pod age, status → badge color).

**Changed:**
- `RootNavigator.tsx` — the "Services" and "Incidents" tabs now render the new Pod
  screens instead of the fictional ones; a new `PodDetail` stack route was added.
- `navigation/types.ts` — added the `PodDetail: { namespace, name }` route param.
- `constants/theme.ts` — added `high`/`medium` severity colors (the fictional data only
  ever needed `critical`/`major`/`minor`).

**Deliberately left alone:** the original fictional screens, hooks, and services
(`ServicesScreen`, `IncidentsScreen`, `useServices`, `useIncidents`, `servicesApi.ts`,
`incidentsApi.ts`, `ServiceCard`, `IncidentCard`, `ServicesDashboard`) still exist in the
codebase, fully intact — just no longer referenced by the navigator. Nothing was deleted.
They're easy to remove later, or easy to resurrect if useful as a reference.

## 11. What's verified working right now

Tested live, on the Android emulator, against the real tunnel:

- **Pods tab**: real dashboard (34/34 running, 0 not ready, 0 failed), real pod list with
  live restart counts, ages, CPU/memory.
- **Incidents tab**: correctly shows "No active incidents — cluster looks healthy,"
  matching the cluster's real state.
- **Pod detail**: full container state, node placement, pod IP, resource usage
  (with/without limits handled correctly), and **live logs** — verified against
  `analyticstoken-be`'s actual running output.

## 12. What's intentionally not done yet

- **WebSocket wiring for Kubernetes events in React Native.** The backend broadcasts
  `pod_updated`, `pod_deleted`, `pod_incident_created/updated/resolved` over the existing
  WebSocket connection (documented in `docs/41-kubernetes-api-contract.md`), but the
  mobile app doesn't consume them yet — it currently only gets Kubernetes data via REST
  + pull-to-refresh. This was an explicit "not yet" earlier in the process and hasn't
  been revisited.
- **Cluster-wide / multi-namespace monitoring.** Everything currently targets
  `ns-onprem-apps` specifically. The namespace is a parameter, not hardcoded deep in the
  logic, so extending this is mostly a UI/routing question, not a backend rewrite.
- **A fallback for MEDIUM CPU/memory detection on pods with no resource limits** — see
  §8. No decision made yet on which direction to take it.
- **Removing the now-unused fictional simulator code** from the mobile app — left in
  place on purpose, not yet deleted.

## 13. Security posture, recap

- Every Kubernetes API call in this codebase is a `GET`. There is no code path — in
  `client.js`, `routes.js`, `realtime.js`, or anywhere else — that can mutate the
  cluster.
- No SSH password, kubeconfig, token, or any other production credential is stored,
  logged, or transmitted by this codebase at any point. The `kubectl proxy` on the server
  authenticates using the operator's own local kubeconfig; the tunnel is a plain SSH port
  forward; the Node backend only ever speaks to `localhost`.
- The tunnel is started manually, by a human, every time — never scripted, never
  triggered automatically by this codebase, and nothing here would even know how to
  start it.
