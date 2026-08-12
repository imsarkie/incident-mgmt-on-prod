// Talks only to the local `kubectl proxy` (started manually on the production server and
// tunneled here over SSH — see docs/40-kubernetes-monitoring.md). No credentials of any
// kind live in this codebase: the proxy authenticates to the API server on the server
// side using the operator's own kubeconfig, and this process only ever speaks plain HTTP
// to 127.0.0.1.
export const K8S_PROXY_URL = process.env.K8S_PROXY_URL ?? "http://127.0.0.1:8001";
export const K8S_NAMESPACE = process.env.K8S_NAMESPACE ?? "ns-onprem-apps";
