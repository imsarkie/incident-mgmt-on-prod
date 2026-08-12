import { useAsync } from "./useAsync";
import { getPodDetail, getPods } from "../services/k8sApi";

export function usePods() {
  return useAsync(getPods, [], "pods");
}

export function usePodDetail(namespace: string, name: string) {
  return useAsync((signal) => getPodDetail(namespace, name, signal), [namespace, name], `pod:${namespace}/${name}`);
}
