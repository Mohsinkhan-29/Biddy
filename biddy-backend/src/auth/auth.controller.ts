import type { Request, Response, NextFunction } from "express";
import { loginWithGoogle, loginWithGoogleIdToken, refreshSession, logout } from "./auth.service.js";

export async function googleLoginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken: googleAccessToken } = req.body as { accessToken?: string };
    if (!googleAccessToken) {
      return res.status(400).json({ error: "accessToken is required" });
    }

    const result = await loginWithGoogle(googleAccessToken);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}

export async function googleWebLoginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      return res.status(400).json({ error: "credential is required" });
    }
    res.json(await loginWithGoogleIdToken(credential));
  } catch (err) {
    if (err instanceof Error) {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" });
    }

    const result = await refreshSession(refreshToken);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await logout(refreshToken);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
