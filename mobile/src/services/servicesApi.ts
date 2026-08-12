import { apiFetch } from "./api";
import type { Service } from "../types/domain";

export function getServices(signal?: AbortSignal): Promise<Service[]> {
  return apiFetch<Service[]>("/api/services", { signal });
}

export function getServiceById(id: string, signal?: AbortSignal): Promise<Service> {
  return apiFetch<Service>(`/api/services/${id}`, { signal });
}
