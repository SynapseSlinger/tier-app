import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchResult } from './imageSearch';

const PREFIX = 'search_cache_v1:';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 Tage

interface CacheEntry {
  results: SearchResult[];
  ts: number;
}

function key(query: string, provider: string): string {
  return `${PREFIX}${provider}:${query.trim().toLowerCase()}`;
}

export async function getCached(
  query: string,
  provider: string
): Promise<SearchResult[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key(query, provider));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > TTL_MS) {
      await AsyncStorage.removeItem(key(query, provider));
      return null;
    }
    return entry.results;
  } catch {
    return null;
  }
}

export async function setCached(
  query: string,
  provider: string,
  results: SearchResult[]
): Promise<void> {
  try {
    const entry: CacheEntry = { results, ts: Date.now() };
    await AsyncStorage.setItem(key(query, provider), JSON.stringify(entry));
  } catch {
    // storage full or unavailable — fail silently
  }
}

export async function clearCache(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    return cacheKeys.length;
  } catch {
    return 0;
  }
}

export async function getCacheStats(): Promise<{ entries: number; sizeKB: number }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(PREFIX));
    const pairs = await AsyncStorage.multiGet(cacheKeys);
    const sizeBytes = pairs.reduce((sum, [, v]) => sum + (v?.length ?? 0), 0);
    return { entries: cacheKeys.length, sizeKB: Math.round(sizeBytes / 1024) };
  } catch {
    return { entries: 0, sizeKB: 0 };
  }
}
