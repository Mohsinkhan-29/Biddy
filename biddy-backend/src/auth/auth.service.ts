import { prisma } from "../prisma/prisma.js";
import { verifyGoogleAccessToken, verifyGoogleIdToken, type GoogleProfile } from "./oauth.js";
import { withCurrentPlan, isAdminEmail } from "../users/plan.js";
import {
  generateAccessToken,
  generateRefreshToken,
  refreshTokenExpiryDate,
  verifyRefreshToken,
} from "./jwt.js";
import { logger } from "../utils/logger.js";
import type { User } from "@prisma/client";

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  plan: string;
  planExpiresAt: string | null;
  isAdmin: boolean;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
    isAdmin: isAdminEmail(user.email),
  };
}

async function issueTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateAccessToken({ id: user.id, email: user.email, plan: user.plan });
  const refreshToken = generateRefreshToken({ id: user.id });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

/** Extension: Google access token from chrome.identity. */
export async function loginWithGoogle(googleAccessToken: string): Promise<AuthResult> {
  return loginWithProfile(await verifyGoogleAccessToken(googleAccessToken));
}

/** Website: Google ID token from Google Identity Services. Same account either way. */
export async function loginWithGoogleIdToken(idToken: string): Promise<AuthResult> {
  return loginWithProfile(await verifyGoogleIdToken(idToken));
}

/** Find or create the user → apply plan expiry → issue our own tokens. */
async function loginWithProfile(profile: GoogleProfile): Promise<AuthResult> {
  const upserted = await prisma.user.upsert({
    where: { googleId: profile.googleId },
    create: {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    },
    // keep name/picture fresh in case they change their Google profile;
    // never touch `plan` here — that's managed by billing, not login.
    update: {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    },
  });

  const user = await withCurrentPlan(upserted);
  const tokens = await issueTokens(user);
  return { ...tokens, user: toPublicUser(user) };
}

/** Verify the refresh token's signature AND that it's still a live DB record, then rotate it. */
export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  let payload: { id: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.userId !== payload.id) {
    throw new Error("Refresh token has been revoked");
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
    throw new Error("Refresh token has expired");
  }

  const found = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!found) {
    throw new Error("User no longer exists");
  }
  const user = await withCurrentPlan(found);

  // rotate: delete the used token, issue a brand new pair
  await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
  const tokens = await issueTokens(user);
  return { ...tokens, user: toPublicUser(user) };
}

/** Best-effort revoke — logout should still succeed client-side even if the token was already gone. */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
  } catch (err) {
    logger.warn("Logout: refresh token not found (already revoked?)", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
