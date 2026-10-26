/**
 * Plan catalogue as shown in the extension. The backend enforces the real
 * limits (biddy-backend/src/config/plans.ts) — this is display only.
 */
export type PlanId = "free" | "standard" | "premium";

export const PLANS: Record<PlanId, { label: string; price: string; ai: boolean; proposalsPerMonth: number }> = {
  free: { label: "Free", price: "$0", ai: false, proposalsPerMonth: 0 },
  standard: { label: "Standard", price: "$10 / month", ai: true, proposalsPerMonth: 100 },
  premium: { label: "Premium", price: "$25 / month", ai: true, proposalsPerMonth: Infinity },
};

export function planOf(plan: string | undefined): PlanId {
  return plan === "standard" || plan === "premium" ? plan : "free";
}