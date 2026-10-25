import { prisma } from "../prisma/prisma.js";
import { getCurrentUsage } from "../usage/usage.service.js";
import { withCurrentPlan } from "./plan.js";
import { toPublicUser } from "../auth/auth.service.js";

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { ...toPublicUser(await withCurrentPlan(user)), createdAt: user.createdAt };
}

const HISTORY_PAGE_SIZE = 50;

export async function getUserHistory(userId: string) {
  const [proposals, analyses] = await Promise.all([
    prisma.proposal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_PAGE_SIZE,
    }),
    prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_PAGE_SIZE,
    }),
  ]);

  return { proposals, analyses };
}

export async function getUserUsage(userId: string) {
  const usage = await getCurrentUsage(userId);
  return (
    usage ?? {
      month: new Date().toISOString().slice(0, 7),
      tokensUsed: 0,
      proposalsGenerated: 0,
      analysesGenerated: 0,
      apiCalls: 0,
    }
  );
}
