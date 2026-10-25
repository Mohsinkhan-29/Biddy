import { analyzeJobWithGemini } from "../services/gemini.service.js";
import { getCached, setCached } from "../services/cache.service.js";
import { prisma } from "../prisma/prisma.js";
import { incrementUsage } from "../usage/usage.service.js";
import type { AnalyzeRequestBody } from "../schemas/analyze.schema.js";
import { logger } from "../utils/logger.js";
import { planOf } from "../config/plans.js";

export async function createAnalysis(userId: string, plan: string, body: AnalyzeRequestBody) {
  const { job } = body;
  const { model, deep } = planOf(plan);

  // standard and deep answers differ, so they're cached separately
  const cacheKey = `${deep ? "deep" : "std"}:${job.jobId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info("Serving cached analysis", { jobId: job.jobId, deep });
    return cached;
  }

  const ai = await analyzeJobWithGemini(job, { model, deep });
  setCached(cacheKey, ai);

  await prisma.analysis.create({
    data: {
      userId,
      title: job.title || job.jobId,
      analysis: JSON.stringify(ai),
    },
  });

  await incrementUsage(userId, { analysesGenerated: 1, apiCalls: 1 });

  return ai;
}