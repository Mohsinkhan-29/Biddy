import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/prisma.js";
import { validateBody } from "../middleware/validateRequest.js";

/**
 * Manual payments: the user pays outside the app, then tells us here which
 * plan they paid for and a reference we can match. An admin approves it.
 */
export const billingRouter = Router();

const requestSchema = z.object({
  plan: z.enum(["standard", "premium"]),
  paymentRef: z.string().trim().min(3, "Add your payment reference").max(200),
});

/** The user's most recent request (or null). */
billingRouter.get("/request", async (req, res, next) => {
  try {
    const latest = await prisma.upgradeRequest.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(latest);
  } catch (err) {
    next(err);
  }
});

/** Create a request — or update the open one, so a user never has two pending. */
billingRouter.post("/request", validateBody(requestSchema), async (req, res, next) => {
  try {
    const { plan, paymentRef } = req.body as z.infer<typeof requestSchema>;
    const userId = req.user!.id;

    const pending = await prisma.upgradeRequest.findFirst({ where: { userId, status: "pending" } });
    const saved = pending
      ? await prisma.upgradeRequest.update({ where: { id: pending.id }, data: { plan, paymentRef } })
      : await prisma.upgradeRequest.create({ data: { userId, plan, paymentRef } });

    res.status(pending ? 200 : 201).json(saved);
  } catch (err) {
    next(err);
  }
});
