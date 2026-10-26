import type { NextFunction, Request, Response } from "express";
import { GoogleGenerativeAIError, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { logger } from "../utils/logger.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Gemini failures get a specific, user-readable reason (no keys or internals);
 * anything else stays a generic 500 with the detail in the server log.
 */
function geminiReason(err: GoogleGenerativeAIError): { status: number; error: string } {
  if (err instanceof GoogleGenerativeAIFetchError) {
    switch (err.status) {
      case 429:
        return { status: 429, error: "The AI is busy (Gemini rate limit reached). Try again in a minute." };
      case 404:
        return { status: 502, error: "The AI model set on the server isn't available. Check GEMINI_MODEL / GEMINI_MODEL_PREMIUM." };
      case 400:
      case 401:
      case 403:
        if (/api key/i.test(err.message))
          return { status: 502, error: "The server's Gemini API key was rejected. Check GEMINI_API_KEY." };
        return { status: 502, error: `Gemini refused the request (${err.status} ${err.statusText ?? ""}).`.trim() };
      case 500:
      case 503:
        return { status: 503, error: "Gemini is temporarily unavailable. Try again shortly." };
    }
  }
  if (/blocked|safety/i.test(err.message))
    return { status: 502, error: "Gemini declined to answer for this job post. Try another job." };
  return { status: 502, error: "The AI service failed. Try again in a moment." };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled request error", { message });

  if (err instanceof GoogleGenerativeAIError) {
    const { status, error } = geminiReason(err);
    return res.status(status).json({ error });
  }
  if (message.startsWith("Gemini returned malformed JSON")) {
    return res.status(502).json({ error: "The AI gave an unreadable answer. Try again." });
  }
  res.status(500).json({ error: "Internal server error" });
}
