import { generateProposalWithGemini } from "../services/gemini.service.js";
import { prisma } from "../prisma/prisma.js";
import { incrementUsage, getCurrentUsage } from "../usage/usage.service.js";
import { planOf } from "../config/plans.js";
import { HttpError } from "../utils/httpError.js";
import type { ProposalRequestBody } from "../schemas/proposal.schema.js";

export async function createProposal(userId: string, plan: string, body: ProposalRequestBody) {
  const { jobDescription, persona, userProfile, jobId, title, company } = body;
  const { model, proposalsPerMonth } = planOf(plan);

  // ponytail: check-then-increment, so two simultaneous requests at 99 can
  // both pass; move to a conditional UPDATE if that ever matters for billing
  if (Number.isFinite(proposalsPerMonth)) {
    const used = (await getCurrentUsage(userId))?.proposalsGenerated ?? 0;
    if (used >= proposalsPerMonth) {
      throw new HttpError(
        403,
        `You've used all ${proposalsPerMonth} proposals for this month. Upgrade to Premium for unlimited proposals.`,
      );
    }
  }

  const draft = await generateProposalWithGemini(jobDescription, persona, userProfile, model);

  const saved = await prisma.proposal.create({
    data: {
      userId,
      title: title?.trim() || jobDescription.slice(0, 80),
      company: company ?? null,
      proposal: draft,
    },
  });

  await incrementUsage(userId, { proposalsGenerated: 1, apiCalls: 1 });

  return { draft, proposalId: saved.id, jobId };
}