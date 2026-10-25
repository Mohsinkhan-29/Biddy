import { prisma } from "../prisma/prisma.js";
import type { Usage } from "@prisma/client";

/** "2026-07" — one Usage row per user per calendar month. */
export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export interface UsageIncrement {
  tokensUsed?: number;
  proposalsGenerated?: number;
  analysesGenerated?: number;
  apiCalls?: number;
}

/** Every AI request calls this once, after the request succeeds. */
export async function incrementUsage(userId: string, delta: UsageIncrement): Promise<Usage> {
  const month = currentMonthKey();

  return prisma.usage.upsert({
    where: { userId_month: { userId, month } },
    create: {
      userId,
      month,
      tokensUsed: delta.tokensUsed ?? 0,
      proposalsGenerated: delta.proposalsGenerated ?? 0,
      analysesGenerated: delta.analysesGenerated ?? 0,
      apiCalls: delta.apiCalls ?? 1,
    },
    update: {
      tokensUsed: { increment: delta.tokensUsed ?? 0 },
      proposalsGenerated: { increment: delta.proposalsGenerated ?? 0 },
      analysesGenerated: { increment: delta.analysesGenerated ?? 0 },
      apiCalls: { increment: delta.apiCalls ?? 1 },
    },
  });
}

export async function getCurrentUsage(userId: string): Promise<Usage | null> {
  return prisma.usage.findUnique({
    where: { userId_month: { userId, month: currentMonthKey() } },
  });
}
