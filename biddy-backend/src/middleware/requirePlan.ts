import type { NextFunction, Request, Response } from "express";
import { planOf } from "../config/plans.js";
import { prisma } from "../prisma/prisma.js";
import { withCurrentPlan } from "../users/plan.js";

/**
 * Blocks AI routes for the free plan. Reads the plan from the DB rather than
 * the access token, so an approval or expiry applies on the very next request
 * (one indexed lookup — negligible next to a Gemini call).
 */
export async function requireAiPlan(req: Request, res: Response, next: NextFunction) {
  let plan = "free";
  try {
    const found = req.user ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;
    if (found) plan = (await withCurrentPlan(found)).plan;
  } catch (err) {
    return next(err); // Express 4 doesn't catch async rejections itself
  }
  if (req.user) req.user.plan = plan; // downstream (model choice, quota) sees the same plan

  if (!planOf(plan).ai) {
    return res.status(403).json({
      error: "AI analysis and proposals are on the Standard and Premium plans.",
      code: "upgrade_required",
    });
  }
  next();
}
