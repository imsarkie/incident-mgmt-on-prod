import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "../storage/cache";
import { useNetworkStatus } from "../context/NetworkContext";

type Status = "loading" | "refreshing" | "success" | "error";

interface AsyncResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isFromCache: boolean;
  cachedAt: string | null;
  refetch: () => void;
  /** Patch `data` locally (e.g. from a realtime event) without a network round-trip. */
  mutate: (updater: T | ((prev: T | null) => T)) => void;
}

/**
 * Generic "fetch something into state" hook. `fetcher` receives an AbortSignal so
 * callers can cancel in-flight requests; `deps` re-runs the fetch when they change
 * (e.g. an `id` param) — same rules as useEffect's dependency array.
 *
 * `cacheKey`, if given, makes this offline-first: successful fetches are written to
 * AsyncStorage under that key, and a fetch that fails (or is skipped because the device
 * is known offline) falls back to whatever was last cached, exposed via `isFromCache`.
 */
export function useAsync<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  cacheKey?: string
): AsyncResult<T> {
  const { isConnected } = useNetworkStatus();
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  // Tracks whichever request is currently "the one that matters." Starting a new load
  // (e.g. a second pull-to-refresh fired before the first finished) aborts whatever this
  // pointed to previously, so only ever one request is in flight at a time.
  const activeControllerRef = useRef<AbortController | null>(null);

  const loadFromCache = useCallback(async (): Promise<boolean> => {
    if (!cacheKey) return false;
    const cached = await readCache<T>(cacheKey);
    if (!cached) return false;
    setData(cached.data);
    setIsFromCache(true);
    setCachedAt(cached.cachedAt);
    setStatus("success");
    setError(null);
    return true;
  }, [cacheKey]);

  const load = useCallback(
    (mode: "loading" | "refreshing") => {
      activeControllerRef.current?.abort();
      const controller = new AbortController();
      activeControllerRef.current = controller;

      if (!isConnected) {
        loadFromCache().then((hadCache) => {
          if (activeControllerRef.current !== controller) return;
          if (!hadCache) {
            setStatus("error");
            setError("You're offline and no cached data is available yet.");
          }
        });
        return;
      }

      setStatus(mode);
      setError(null);

      fetcher(controller.signal)
        .then((result) => {
          if (activeControllerRef.current !== controller) return; // superseded by a newer call
          setData(result);
          setStatus("success");
          setIsFromCache(false);
          setCachedAt(null);
          if (cacheKey) writeCache(cacheKey, result);
        })
        .catch(async (err: unknown) => {
          // Check the controller's own signal rather than the thrown error's name/message:
          // different fetch implementations wrap an aborted request differently (a plain
          // DOMException named "AbortError" in some, a TypeError("fetch failed") with the
          // real reason nested in `.cause` in others) — the signal itself is the one
          // reliable source of truth for "did *we* cancel this on purpose."
          if (controller.signal.aborted) return;
          const hadCache = await loadFromCache();
          if (activeControllerRef.current !== controller) return;
          if (!hadCache) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong");
          }
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isConnected, cacheKey, loadFromCache, ...deps]
  );

  useEffect(() => {
    load(hasLoadedOnceRef.current ? "refreshing" : "loading");
    hasLoadedOnceRef.current = true;
    return () => activeControllerRef.current?.abort();
  }, [load]);

  const mutate = useCallback((updater: T | ((prev: T | null) => T)) => {
    setData((prev) => (typeof updater === "function" ? (updater as (prev: T | null) => T)(prev) : updater));
  }, []);

  return {
    data,
    error,
    isLoading: status === "loading",
    isRefreshing: status === "refreshing",
    isFromCache,
    cachedAt,
    refetch: () => load("refreshing"),
    mutate,
  };
}
