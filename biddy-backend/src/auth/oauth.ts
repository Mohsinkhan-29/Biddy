import { env } from "../config/env.js";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * The website signs in with Google Identity Services, which hands back an
 * ID token (a signed JWT). Google's tokeninfo endpoint checks the signature
 * and expiry for us; we then insist it was minted for OUR web client.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!idToken) throw new Error("Missing Google ID token");
  if (!env.googleWebClientId) throw new Error("Website sign-in is not configured (GOOGLE_WEB_CLIENT_ID)");

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) throw new Error("Invalid or expired Google sign-in");

  const info = (await res.json()) as {
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  };

  if (info.aud !== env.googleWebClientId) throw new Error("Google sign-in was not issued for this website");
  if (info.iss !== "accounts.google.com" && info.iss !== "https://accounts.google.com")
    throw new Error("Unexpected Google token issuer");
  if (!info.sub || !info.email || String(info.email_verified) !== "true")
    throw new Error("Google account email is not verified");

  return { googleId: info.sub, email: info.email, name: info.name ?? info.email, picture: info.picture };
}

/**
 * The extension obtains a Google OAuth **access token** via
 * chrome.identity.getAuthToken() (the standard, no-extra-deps flow for MV3
 * extensions — chrome.identity doesn't hand back an ID token). We verify it
 * two ways before trusting it:
 *
 *  1. tokeninfo — confirms the token is live and its `aud` matches OUR
 *     GOOGLE_CLIENT_ID, so a token minted for some other app can't be replayed.
 *  2. userinfo — fetches the actual profile (sub/email/name/picture) using
 *     the token, which only succeeds if Google itself considers it valid.
 */
export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleProfile> {
  if (!accessToken) {
    throw new Error("Missing Google access token");
  }

  const tokenInfoRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!tokenInfoRes.ok) {
    throw new Error("Invalid or expired Google access token");
  }
  const tokenInfo = (await tokenInfoRes.json()) as { aud?: string; expires_in?: string };
  if (tokenInfo.aud !== env.googleClientId) {
    throw new Error("Google token was not issued for this application");
  }

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userInfoRes.ok) {
    throw new Error("Failed to fetch Google profile");
  }

  const profile = (await userInfoRes.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  };

  if (!profile.sub || !profile.email) {
    throw new Error("Google profile is missing required fields");
  }

  return {
    googleId: profile.sub,
    email: profile.email,
    name: profile.name ?? profile.email,
    picture: profile.picture,
  };
}
