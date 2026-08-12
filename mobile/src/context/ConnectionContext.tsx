import { createContext, useContext, type ReactNode } from "react";
import { useIncidentWebSocket } from "../hooks/useIncidentWebSocket";
import type { ConnectionState, IncidentWebSocketEvent } from "../types/websocket";

interface ConnectionValue {
  connectionState: ConnectionState;
  lastEvent: IncidentWebSocketEvent | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionValue | null>(null);

/**
 * A WebSocket connection is a single, stateful, app-wide resource — like the NetInfo
 * subscription in NetworkContext, it should exist once for the app's lifetime, not once
 * per screen that wants realtime data. Mounting useIncidentWebSocket() here, once, and
 * broadcasting its result via Context is what lets both the Services and Incidents
 * screens react to the same live socket without either of them opening a second one.
 */
export function ConnectionProvider({ children }: { children: ReactNode }) {
  const value = useIncidentWebSocket();
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionValue {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}
