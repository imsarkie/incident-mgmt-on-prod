import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "../constants/config";
import type { ConnectionState, IncidentWebSocketEvent } from "../types/websocket";

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

interface UseIncidentWebSocketResult {
  connectionState: ConnectionState;
  lastEvent: IncidentWebSocketEvent | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function useIncidentWebSocket(): UseIncidentWebSocketResult {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [lastEvent, setLastEvent] = useState<IncidentWebSocketEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs, not state: the socket instance, timers, and flags below are read/written
  // from inside WebSocket event callbacks and setTimeout callbacks — code that runs
  // *outside* of React's render cycle. A ref's `.current` is always the latest value;
  // state read inside a closure captured at render time would be stale (see
  // docs/17-websocket-client.md for why `new WebSocket(...)` can't live in state either).
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const isMountedRef = useRef(true);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Guard against opening a second socket while one is already open/opening —
    // this is what makes connect() safe to call from reconnect(), from onclose's
    // retry schedule, and from the mount effect without ever risking duplicates.
    if (socketRef.current) return;

    intentionalCloseRef.current = false;
    setConnectionState(attemptRef.current === 0 ? "connecting" : "reconnecting");

    const socket = new WebSocket(WS_URL!);
    socketRef.current = socket;

    // Every handler below checks `socketRef.current !== socket` first — this socket may
    // have been *superseded* (told to close, e.g. by an unmount) before it actually
    // finished connecting. On Android specifically, calling close() on a still-CONNECTING
    // socket doesn't reliably abort the native handshake: the connection can go on to open
    // for real and fire a belated `onopen` anyway. If we didn't check for that here, a
    // stale socket's late `onopen` could overwrite state that now belongs to a newer,
    // legitimate connection — and, just as importantly, the stale socket itself would be
    // left open with nothing left holding a reference to it, leaking a real TCP connection
    // to the backend forever. So a stale `onopen` explicitly force-closes itself.
    socket.onopen = () => {
      if (socketRef.current !== socket) {
        socket.close();
        return;
      }
      attemptRef.current = 0;
      setConnectionState("connected");
      setError(null);
    };

    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return;
      try {
        const parsed = JSON.parse(event.data) as IncidentWebSocketEvent;
        setLastEvent(parsed);
      } catch {
        // A malformed frame shouldn't crash the connection — drop it and keep listening.
      }
    };

    socket.onerror = () => {
      if (socketRef.current !== socket) return;
      setConnectionState("error");
      setError("WebSocket connection error");
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      if (!isMountedRef.current) return;

      if (intentionalCloseRef.current) {
        setConnectionState("disconnected");
        return;
      }

      setConnectionState("reconnecting");
      const attempt = attemptRef.current;
      attemptRef.current = Math.min(attempt + 1, 10); // cap so the exponent can't grow unbounded
      const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);

      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, delay);
    };
  }, [clearReconnectTimer]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearReconnectTimer();
    attemptRef.current = 0;
    socketRef.current?.close();
    socketRef.current = null;
    setConnectionState("disconnected");
  }, [clearReconnectTimer]);

  const reconnect = useCallback(() => {
    intentionalCloseRef.current = true; // prevent the closing socket's onclose from also scheduling a retry
    clearReconnectTimer();
    attemptRef.current = 0;
    socketRef.current?.close();
    socketRef.current = null;
    intentionalCloseRef.current = false;
    connect();
  }, [clearReconnectTimer, connect]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connectionState, lastEvent, error, reconnect, disconnect };
}
