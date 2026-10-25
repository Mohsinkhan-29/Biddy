import type { User } from "@prisma/client";
import { prisma } from "../prisma/prisma.js";
import { env } from "../config/env.js";

/**
 * A paid plan past its planExpiresAt drops back to free — persisted, so every
 * later read agrees. Called wherever the plan is about to be trusted.
 */
export async function withCurrentPlan(user: User): Promise<User> {
  if (user.plan !== "free" && user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) {
    return prisma.user.update({
      where: { id: user.id },
      data: { plan: "free", planExpiresAt: null },
    });
  }
  return user;
}

export function isAdminEmail(email: string): boolean {
  return env.adminEmails.includes(email.toLowerCase());
}
