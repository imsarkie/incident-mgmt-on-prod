export type PodStatus = "Running" | "Pending" | "Succeeded" | "Failed" | "Unknown";
export type ContainerRuntimeState = "running" | "waiting" | "terminated" | "unknown";
export type IncidentSeverity = "critical" | "high" | "medium";
export type IncidentStatus = "active" | "resolved";

export interface ContainerState {
  name: string;
  ready: boolean;
  restartCount: number;
  state: ContainerRuntimeState;
  reason: string | null;
  lastTerminationReason: string | null;
}

export interface Pod {
  namespace: string;
  name: string;
  status: PodStatus;
  ready: boolean;
  readyContainers: number;
  totalContainers: number;
  restartCount: number;
  createdAt: string | null;
  node: string | null;
  podIP: string | null;
  labels: Record<string, string>;
  containers: ContainerState[];
  cpuMillicores: number | null;
  memoryBytes: number | null;
  cpuLimitMillicores: number | null;
  memoryLimitBytes: number | null;
}

export interface K8sEvent {
  id: string;
  type: "Normal" | "Warning";
  reason: string;
  message: string;
  involvedObject: { kind: string; name: string; namespace: string };
  count: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface Overview {
  namespace: string;
  totalPods: number;
  runningPods: number;
  notReadyPods: number;
  failedPods: number;
  totalRestarts: number;
  activeIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  generatedAt: string;
}

export interface PodIncident {
  id: string;
  severity: IncidentSeverity;
  reason: string;
  title: string;
  message: string;
  namespace: string;
  podName: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}
