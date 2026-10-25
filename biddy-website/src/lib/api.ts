import { API_URL } from "./config";

/**
 * Talks to the same backend as the extension. Tokens live in localStorage.
 * ponytail: localStorage is readable by any script on the page — fine while
 * the site loads no third-party scripts besides Google sign-in; move to
 * httpOnly cookies (same-site API domain) if that changes.
 */

export interface SiteUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  plan: "free" | "standard" | "premium";
  planExpiresAt: string | null;
  isAdmin: boolean;
}

const ACCESS = "biddy_web_access";
const REFRESH = "biddy_web_refresh";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(access: string, refresh: string) {
  try {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  } catch {
    /* private mode — session lasts this page only */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  } catch {
    /* nothing stored */
  }
}

export function hasSession(): boolean {
  return Boolean(read(ACCESS) && read(REFRESH));
}

async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    return (JSON.parse(text) as { error?: string }).error || text || `Request failed (${res.status})`;
  } catch {
    return text || `Request failed (${res.status})`;
  }
}

/** Exchange Google's sign-in credential for Biddy tokens. */
export async function signInWithGoogle(credential: string): Promise<SiteUser> {
  const res = await fetch(`${API_URL}/api/auth/google-web`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const data = (await res.json()) as { accessToken: string; refreshToken: string; user: SiteUser };
  write(data.accessToken, data.refreshToken);
  return data.user;
}

async function refresh(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: read(REFRESH) }),
  });
  if (!res.ok) {
    clearSession();
    throw new Error("Your session expired. Sign in again.");
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  write(data.accessToken, data.refreshToken);
  return data.accessToken;
}

/** Authenticated call; refreshes the access token once on 401. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const send = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token ?? ""}`,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  let res = await send(read(ACCESS));
  if (res.status === 401 && read(REFRESH)) res = await send(await refresh());
  if (!res.ok) throw new Error(await errorMessage(res));
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function signOut() {
  const token = read(REFRESH);
  clearSession();
  if (token) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    }).catch(() => undefined);
  }
}
