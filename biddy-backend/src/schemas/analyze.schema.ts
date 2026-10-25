import { z } from "zod";

const scrapedClientSchema = z.object({
  paymentVerified: z.boolean(),
  identityVerified: z.boolean(),
  totalSpent: z.number().optional(),
  hireRate: z.number().min(0).max(1).optional(),
  jobsPosted: z.number().optional(),
  location: z.string().optional(),
  recentFeedbackText: z.string().optional(),
});

const scrapedJobSchema = z.object({
  jobId: z.string().min(1),
  url: z.string().url(),
  title: z.string(),
  description: z.string().min(1, "job description is required for analysis"),
  budgetType: z.enum(["fixed", "hourly"]),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  proposalsTier: z.string(),
  connectsRequired: z.number(),
  postedAt: z.string().optional(),
  client: scrapedClientSchema,
});

export const analyzeRequestSchema = z.object({
  job: scrapedJobSchema,
});

export type AnalyzeRequestBody = z.infer<typeof analyzeRequestSchema>;
