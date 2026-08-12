import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkStatus | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });
  }, []);

  return <NetworkContext.Provider value={status}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus(): NetworkStatus {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkStatus must be used within a NetworkProvider");
  }
  return context;
}
