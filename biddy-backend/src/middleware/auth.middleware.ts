import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt.js";

/** Verify JWT → attach req.user → next(). Used on every route except /api/auth/*. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    // expired vs malformed both just mean "the client should hit /api/auth/refresh"
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}
