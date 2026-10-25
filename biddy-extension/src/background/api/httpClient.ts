import { getConfig } from "@shared/utils/storage";
import { getAuthTokens, setAuthSession, getStoredUser, clearAuthSession } from "@shared/utils/authStorage";
import type { AuthTokens, StoredUser } from "@shared/types";

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function refreshAccessToken(): Promise<string> {
  const tokens = await getAuthTokens();
  if (!tokens) throw new Error("Not logged in");

  const config = await getConfig();
  const res = await fetch(`${config.backendUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!res.ok) {
    // refresh token is dead too — the user has to log back in
    await clearAuthSession();
    throw new Error("Your session expired. Please log in again.");
  }

  // the backend re-reads the user on refresh, so this is also where a plan
  // change (upgrade/downgrade) reaches the extension
  const data = (await res.json()) as AuthTokens & { user: StoredUser };
  await setAuthSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
  return data.accessToken;
}

/**
 * The one place every protected backend call goes through: attaches the
 * current access token, and on a 401 (expired token) refreshes once and
 * retries the original request exactly once before giving up.
 */
export async function authedFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const config = await getConfig();
  const tokens = await getAuthTokens();
  if (!tokens) throw new Error("Not logged in");

  const doFetch = (accessToken: string) =>
    fetch(`${config.backendUrl}${path}`, {
      method: options.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

  let res = await doFetch(tokens.accessToken);

  if (res.status === 401) {
    const newAccessToken = await refreshAccessToken();
    res = await doFetch(newAccessToken);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      message = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {
      /* not JSON — keep raw text */
    }
    throw new Error(message || `Backend error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// re-exported for authService.ts, which needs the raw user record on login
// without importing storage internals twice
export { getStoredUser };