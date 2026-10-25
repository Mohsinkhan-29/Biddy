import type { Request, Response, NextFunction } from "express";
import { createAnalysis } from "./analysis.service.js";
import type { AnalyzeRequestBody } from "../schemas/analyze.schema.js";

export async function analyzeController(
  req: Request<unknown, unknown, AnalyzeRequestBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const ai = await createAnalysis(req.user!.id, req.user!.plan, req.body);
    res.json(ai);
  } catch (err) {
    next(err);
  }
}