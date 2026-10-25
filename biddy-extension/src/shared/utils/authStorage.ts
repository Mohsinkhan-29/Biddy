import { storageGet, storageSet, storageRemove } from "./storage";
import type { AuthTokens, StoredUser } from "@shared/types";

const ACCESS_TOKEN_KEY = "biddy_access_token";
const REFRESH_TOKEN_KEY = "biddy_refresh_token";
const USER_KEY = "biddy_user";

export async function getAuthTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    storageGet<string>(ACCESS_TOKEN_KEY),
    storageGet<string>(REFRESH_TOKEN_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function getStoredUser(): Promise<StoredUser | undefined> {
  return storageGet<StoredUser>(USER_KEY);
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await storageSet(USER_KEY, user);
}

export async function setAuthSession(tokens: AuthTokens, user: StoredUser): Promise<void> {
  await Promise.all([
    storageSet(ACCESS_TOKEN_KEY, tokens.accessToken),
    storageSet(REFRESH_TOKEN_KEY, tokens.refreshToken),
    storageSet(USER_KEY, user),
  ]);
}

/** Called after a silent token refresh — updates tokens (and user, if the backend sent one) without a full re-login. */
export async function updateTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    storageSet(ACCESS_TOKEN_KEY, tokens.accessToken),
    storageSet(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    storageRemove(ACCESS_TOKEN_KEY),
    storageRemove(REFRESH_TOKEN_KEY),
    storageRemove(USER_KEY),
  ]);
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getAuthTokens()) !== null;
}