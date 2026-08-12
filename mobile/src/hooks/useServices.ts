import { useAsync } from "./useAsync";
import { getServiceById, getServices } from "../services/servicesApi";

export function useServices() {
  return useAsync(getServices, [], "services");
}

export function useServiceDetail(id: string) {
  return useAsync((signal) => getServiceById(id, signal), [id], `service:${id}`);
}
