import { getConfig } from "@shared/utils/storage";
import {
  setAuthSession,
  clearAuthSession,
  getStoredUser,
  getAuthTokens,
  setStoredUser,
  isLoggedIn as hasStoredSession,
} from "@shared/utils/authStorage";
import { authedFetch } from "./api/httpClient";
import type { AuthCheckResult, AuthTokens, StoredUser } from "@shared/types";

/**
 * chrome.identity.getAuthToken() is the standard MV3 way to get a Google
 * OAuth access token scoped to THIS extension's oauth2.client_id (set in
 * manifest.config.ts) — no popup window management needed, Chrome handles
 * the consent screen itself. `interactive: true` shows the consent prompt
 * if there's no cached grant yet; `interactive: false` fails silently if
 * there's nothing cached, which is how we probe for a token to revoke on
 * logout without bothering the user.
 */
function getGoogleAccessToken(interactive: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (result) => {
      if (chrome.runtime.lastError || !result) {
        reject(new Error(chrome.runtime.lastError?.message ?? "Google sign-in was cancelled."));
        return;
      }
      // Chrome 121+ returns { token, grantedScopes }; older versions return a bare string.
      const token = typeof result === "string" ? result : (result as { token?: string }).token;
      if (!token) {
        reject(new Error("Google did not return an access token."));
        return;
      }
      resolve(token);
    });
  });
}

function removeCachedGoogleToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
}

export async function loginWithGoogle(): Promise<StoredUser> {
  const googleAccessToken = await getGoogleAccessToken(true);
  const config = await getConfig();

  const res = await fetch(`${config.backendUrl}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: googleAccessToken }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // a bad/expired Google token is the most common cause here — drop the
    // cache so the next attempt forces a fresh consent instead of retrying
    // the same dead token forever.
    await removeCachedGoogleToken(googleAccessToken).catch(() => undefined);
    throw new Error(`Google sign-in failed: ${text || res.statusText}`);
  }

  const data = (await res.json()) as AuthTokens & { user: StoredUser };
  await setAuthSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
  return data.user;
}

export async function logout(): Promise<void> {
  const config = await getConfig();

  try {
    const tokens = await getAuthTokens();
    if (tokens?.refreshToken) {
      await fetch(`${config.backendUrl}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
    }
  } catch {
    // best-effort — local state gets cleared below regardless of whether the
    // backend call succeeded, so the extension always ends up logged out
  }

  try {
    const cachedToken = await getGoogleAccessToken(false);
    await removeCachedGoogleToken(cachedToken);
  } catch {
    // nothing cached to remove — fine
  }

  await clearAuthSession();
}

export async function checkAuth(): Promise<AuthCheckResult> {
  const loggedIn = await hasStoredSession();
  if (!loggedIn) return { loggedIn: false };

  const user = await getStoredUser();
  if (!user) return { loggedIn: false };

  // Free users make no other backend calls, so this is how an upgrade reaches
  // them. Not awaited: a sleeping free-tier backend must not stall the popup —
  // the new plan shows on the next open.
  authedFetch<StoredUser>("/api/user/me", { method: "GET" })
    .then((fresh) => setStoredUser({ ...user, ...fresh }))
    .catch(() => undefined);

  return { loggedIn: true, user };
}