import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/prisma.js";
import { validateBody } from "../middleware/validateRequest.js";
import { isAdminEmail } from "../users/plan.js";
import { currentMonthKey } from "../usage/usage.service.js";
import { toPublicUser } from "../auth/auth.service.js";

const DAY = 24 * 60 * 60 * 1000;

/** Only Google accounts listed in ADMIN_EMAILS get past this. */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !isAdminEmail(req.user.email)) {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
}

export const adminRouter = Router();
adminRouter.use(requireAdmin);

/** Upgrade requests, newest first. ?status=pending|approved|rejected (default pending). */
adminRouter.get("/requests", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const requests = await prisma.upgradeRequest.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, name: true, plan: true, planExpiresAt: true } } },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

const approveSchema = z.object({ months: z.number().int().min(1).max(12).default(1) });

/**
 * Approve: set the plan and push the expiry out by N×30 days. Renewing the
 * same plan early extends from the current expiry, so paying early never
 * loses days.
 */
adminRouter.post("/requests/:id/approve", validateBody(approveSchema), async (req, res, next) => {
  try {
    const { months } = req.body as z.infer<typeof approveSchema>;
    const request = await prisma.upgradeRequest.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "No pending request with that id." });
    }

    const { user } = request;
    const from =
      user.plan === request.plan && user.planExpiresAt && user.planExpiresAt.getTime() > Date.now()
        ? user.planExpiresAt.getTime()
        : Date.now();

    const [, updated] = await prisma.$transaction([
      prisma.upgradeRequest.update({ where: { id: request.id }, data: { status: "approved", decidedAt: new Date() } }),
      prisma.user.update({
        where: { id: user.id },
        data: { plan: request.plan, planExpiresAt: new Date(from + months * 30 * DAY) },
      }),
    ]);
    res.json(toPublicUser(updated));
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/requests/:id/reject", async (req, res, next) => {
  try {
    const { count } = await prisma.upgradeRequest.updateMany({
      where: { id: req.params.id, status: "pending" },
      data: { status: "rejected", decidedAt: new Date() },
    });
    if (!count) return res.status(404).json({ error: "No pending request with that id." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** All users with plan and this month's usage. */
adminRouter.get("/users", async (_req, res, next) => {
  try {
    const month = currentMonthKey();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500, // ponytail: no pagination yet; add cursor paging past a few hundred users
      include: { usages: { where: { month } } },
    });
    res.json(
      users.map((u) => ({
        ...toPublicUser(u),
        createdAt: u.createdAt,
        usage: {
          proposalsGenerated: u.usages[0]?.proposalsGenerated ?? 0,
          analysesGenerated: u.usages[0]?.analysesGenerated ?? 0,
        },
      })),
    );
  } catch (err) {
    next(err);
  }
});

const setPlanSchema = z.object({
  plan: z.enum(["free", "standard", "premium"]),
  // ISO date, or null for no expiry; ignored for free
  planExpiresAt: z.string().datetime().nullable().optional(),
});

/** Set a user's plan directly (comps, refunds, fixes). */
adminRouter.patch("/users/:id", validateBody(setPlanSchema), async (req, res, next) => {
  try {
    const { plan, planExpiresAt } = req.body as z.infer<typeof setPlanSchema>;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        plan,
        planExpiresAt: plan === "free" ? null : planExpiresAt ? new Date(planExpiresAt) : null,
      },
    });
    res.json(toPublicUser(updated));
  } catch (err) {
    next(err);
  }
});
