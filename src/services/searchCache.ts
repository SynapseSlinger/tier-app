import { SearchResult } from './imageSearch';

const PREFIX = 'search_cache_v1:';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 Tage

interface CacheEntry {
  results: SearchResult[];
  ts: number;
}

const store = typeof localStorage !== 'undefined' ? localStorage : null;

function cacheKey(query: string, provider: string): string {
  return `${PREFIX}${provider}:${query.trim().toLowerCase()}`;
}

export async function getCached(
  query: string,
  provider: string
): Promise<SearchResult[] | null> {
  if (!store) return null;
  try {
    const raw = store.getItem(cacheKey(query, provider));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > TTL_MS) {
      store.removeItem(cacheKey(query, provider));
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
  if (!store) return;
  try {
    const entry: CacheEntry = { results, ts: Date.now() };
    store.setItem(cacheKey(query, provider), JSON.stringify(entry));
  } catch {
    // localStorage voll — still silently
  }
}

export async function clearCache(): Promise<number> {
  if (!store) return 0;
  try {
    const toDelete = Object.keys(store).filter((k) => k.startsWith(PREFIX));
    toDelete.forEach((k) => store.removeItem(k));
    return toDelete.length;
  } catch {
    return 0;
  }
}

export async function getCacheStats(): Promise<{ entries: number; sizeKB: number }> {
  if (!store) return { entries: 0, sizeKB: 0 };
  try {
    const keys = Object.keys(store).filter((k) => k.startsWith(PREFIX));
    const sizeBytes = keys.reduce((sum, k) => sum + (store.getItem(k)?.length ?? 0), 0);
    return { entries: keys.length, sizeKB: Math.round(sizeBytes / 1024) };
  } catch {
    return { entries: 0, sizeKB: 0 };
  }
}
