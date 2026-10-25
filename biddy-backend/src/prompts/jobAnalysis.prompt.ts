import type { ScrapedJob } from "../types/job.types.js";

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    scopeCreepPercent: { type: "number" },
    scopeCreepRisk: { type: "string", enum: ["Low Risk", "Medium Risk", "High Risk"] },
    reviewSentiment: {
      type: "string",
      enum: ["Consistently Positive", "Neutral", "Potential Stress Environment"],
    },
    reviewSentimentReason: { type: "string" },
    clientPersona: { type: "string" },
    biddyProposalMove: { type: "string" },
  },
  required: [
    "scopeCreepPercent",
    "scopeCreepRisk",
    "reviewSentiment",
    "reviewSentimentReason",
    "clientPersona",
    "biddyProposalMove",
  ],
} as const;

/** Premium: everything above plus the extra judgement fields. */
export const DEEP_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    ...ANALYSIS_JSON_SCHEMA.properties,
    bidScore: { type: "number" },
    greenFlags: { type: "array", items: { type: "string" } },
    redFlags: { type: "array", items: { type: "string" } },
    suggestedRate: { type: "string" },
    openingHook: { type: "string" },
  },
  required: [
    ...ANALYSIS_JSON_SCHEMA.required,
    "bidScore",
    "greenFlags",
    "redFlags",
    "suggestedRate",
    "openingHook",
  ],
} as const;

const DEEP_TASKS = `
5. bidScore — 0-100: how worth bidding this job is for a competent freelancer, weighing client quality, competition, clarity and budget fit.
6. greenFlags / redFlags — up to 3 each, short and specific to THIS job (quote the brief where useful). Red flags include unpaid tests, off-platform contact, budget/scope mismatch, unverified payment.
7. suggestedRate — one line: a concrete rate or fixed price and why (e.g. "$45/hr — top of range, competition is light").
8. openingHook — the first sentence of a winning proposal for this exact job, in the freelancer's voice. No greetings, no "I am excited".`;

export function buildAnalysisPrompt(job: ScrapedJob, deep = false): string {
  const { client } = job;

  return `You are analyzing an Upwork job posting for a freelancer deciding whether and how to bid.

JOB TITLE: ${job.title}

JOB DESCRIPTION:
${job.description}

BUDGET: ${job.budgetType} — ${job.budgetMin ?? "?"}–${job.budgetMax ?? "?"}
PROPOSALS SO FAR: ${job.proposalsTier}

CLIENT STATS:
- Payment verified: ${client.paymentVerified}
- Total spent: ${client.totalSpent ?? "unknown"}
- Hire rate: ${client.hireRate ?? "unknown"}
- Jobs posted: ${client.jobsPosted ?? "unknown"}
- Location: ${client.location ?? "unknown"}
- Recent feedback left for other freelancers: ${client.recentFeedbackText ?? "not available"}

Assess:
1. scopeCreepPercent / scopeCreepRisk — how likely is this project's scope to grow beyond what's described, based on vagueness or missing deliverables in the description.
2. reviewSentiment / reviewSentimentReason — tone of the client's recent feedback, if available; if not available, infer cautiously from the description's tone and default toward "Neutral".
3. clientPersona — a short label for this client's likely communication/working style (e.g. "Direct / High Velocity", "Professional / Standard", "Detail-Oriented / Cautious").
4. biddyProposalMove — one concrete, actionable sentence telling the freelancer how to position their proposal for this specific client and job.
${deep ? DEEP_TASKS : ""}

Respond with ONLY valid JSON matching the required schema. No markdown, no commentary.`;
}