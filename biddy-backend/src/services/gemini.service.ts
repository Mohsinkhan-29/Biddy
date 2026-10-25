import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import {
  ANALYSIS_JSON_SCHEMA,
  DEEP_ANALYSIS_JSON_SCHEMA,
  buildAnalysisPrompt,
} from "../prompts/jobAnalysis.prompt.js";
import { buildProposalPrompt } from "../prompts/proposalDraft.prompt.js";
import type { AiMetrics, ScrapedJob, UserProfile } from "../types/job.types.js";
import { logger } from "../utils/logger.js";

const client = new GoogleGenerativeAI(env.geminiApiKey);

export async function analyzeJobWithGemini(
  job: ScrapedJob,
  { model: modelName = env.geminiModel, deep = false }: { model?: string; deep?: boolean } = {},
): Promise<AiMetrics> {
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      // @ts-expect-error - responseSchema typing varies by SDK version; JSON mode
      // is still enforced via responseMimeType above even if this is ignored.
      responseSchema: deep ? DEEP_ANALYSIS_JSON_SCHEMA : ANALYSIS_JSON_SCHEMA,
    },
  });

  const prompt = buildAnalysisPrompt(job, deep);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as AiMetrics;
  } catch (err) {
    logger.error("Failed to parse Gemini analysis response", { text });
    throw new Error("Gemini returned malformed JSON for job analysis");
  }
}

export async function generateProposalWithGemini(
  jobDescription: string,
  persona: string,
  profile: UserProfile,
  modelName: string = env.geminiModel,
): Promise<string> {
  const model = client.getGenerativeModel({ model: modelName });
  const prompt = buildProposalPrompt(jobDescription, persona, profile);
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}