/** Thin typed wrapper around chrome.storage.local so callers never touch the raw API. */

export async function storageGet<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function storageRemove(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

export interface BiddyConfig {
  backendUrl: string; // your Node backend, e.g. http://localhost:4000
  autoAnalyzeFeed: boolean;
  userProfile: {
    skillsSummary: string;
    resumeSummary: string;
    hourlyRate?: number;
    tone: "concise" | "warm" | "formal";
  };
}

const CONFIG_KEY = "biddy_config";

// Set VITE_API_URL in biddy-extension/.env (e.g. https://biddy-backend.onrender.com);
// baked in at build time. Trailing slash stripped so `${backendUrl}/api/...` stays clean.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");

export const DEFAULT_CONFIG: BiddyConfig = {
  backendUrl: API_URL,
  autoAnalyzeFeed: false,
  userProfile: {
    skillsSummary: "",
    resumeSummary: "",
    tone: "concise",
  },
};

export async function getConfig(): Promise<BiddyConfig> {
  const stored = await storageGet<BiddyConfig>(CONFIG_KEY);
  return { ...DEFAULT_CONFIG, ...stored };
}

export async function setConfig(patch: Partial<BiddyConfig>): Promise<BiddyConfig> {
  const current = await getConfig();
  const next = { ...current, ...patch };
  await storageSet(CONFIG_KEY, next);
  return next;
}