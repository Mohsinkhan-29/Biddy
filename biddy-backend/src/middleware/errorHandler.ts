import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { HttpError } from "../utils/httpError.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled request error", { message });
  res.status(500).json({ error: "Internal server error" });
}