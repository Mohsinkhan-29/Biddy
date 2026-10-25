import type { Request, Response, NextFunction } from "express";
import { getUserById, getUserHistory, getUserUsage } from "./user.service.js";

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function historyController(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await getUserHistory(req.user!.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

export async function usageController(req: Request, res: Response, next: NextFunction) {
  try {
    const usage = await getUserUsage(req.user!.id);
    res.json(usage);
  } catch (err) {
    next(err);
  }
}
