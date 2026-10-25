import { storageGet, storageSet } from "@shared/utils/storage";
import type { AiMetrics } from "@shared/types";

const CACHE_KEY = "biddy_job_cache";
const TTL_MS = 24 * 60 * 60 * 1000; // 24h — job postings rarely change after creation

interface CacheEntry {
  ai: AiMetrics;
  cachedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

async function readStore(): Promise<CacheStore> {
  return (await storageGet<CacheStore>(CACHE_KEY)) ?? {};
}

export async function getCachedAnalysis(jobId: string): Promise<AiMetrics | null> {
  const store = await readStore();
  const entry = store[jobId];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) return null;
  return entry.ai;
}

export async function setCachedAnalysis(jobId: string, ai: AiMetrics): Promise<void> {
  const store = await readStore();
  store[jobId] = { ai, cachedAt: Date.now() };
  await storageSet(CACHE_KEY, store);
}
