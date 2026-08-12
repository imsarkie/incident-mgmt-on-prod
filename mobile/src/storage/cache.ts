import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "pulse:cache:";

export interface CacheEnvelope<T> {
  data: T;
  cachedAt: string;
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const envelope: CacheEnvelope<T> = { data, cachedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
}

export async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}
