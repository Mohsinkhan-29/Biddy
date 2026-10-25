import { env } from "./env.js";

/**
 * The source of truth for what each plan may do. User.plan in the DB holds
 * the id; anything unrecognised is treated as free.
 */
export const PLANS = {
  free: { ai: false, deep: false, proposalsPerMonth: 0, model: "" },
  standard: { ai: true, deep: false, proposalsPerMonth: 100, model: env.geminiModel },
  premium: { ai: true, deep: true, proposalsPerMonth: Infinity, model: env.geminiModelPremium },
} as const;

export type PlanId = keyof typeof PLANS;

export function planOf(plan: string | undefined): (typeof PLANS)[PlanId] & { id: PlanId } {
  const id: PlanId = plan === "standard" || plan === "premium" ? plan : "free";
  return { ...PLANS[id], id };
}