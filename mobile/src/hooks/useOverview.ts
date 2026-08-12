import { useAsync } from "./useAsync";
import { getOverview } from "../services/k8sApi";

export function useOverview() {
  return useAsync(getOverview, [], "overview");
}
