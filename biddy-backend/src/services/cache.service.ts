import type { AiMetrics } from "../types/job.types.js";

interface Entry {
  ai: AiMetrics;
  cachedAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const store = new Map<string, Entry>();

/**
 * In-memory cache — fine for a single backend instance / low-traffic personal
 * use. If you deploy multiple instances behind a load balancer, swap this
 * module's internals for Redis (the function signatures below are the only
 * contract the rest of the app depends on, so that's a one-file change).
 */
export function getCached(jobId: string): AiMetrics | null {
  const entry = store.get(jobId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    store.delete(jobId);
    return null;
  }
  return entry.ai;
}

export function setCached(jobId: string, ai: AiMetrics): void {
  store.set(jobId, { ai, cachedAt: Date.now() });
}
