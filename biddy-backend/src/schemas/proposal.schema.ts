import { z } from "zod";

const userProfileSchema = z.object({
  skillsSummary: z.string(),
  resumeSummary: z.string(),
  hourlyRate: z.number().optional(),
  tone: z.enum(["concise", "warm", "formal"]),
});

export const proposalRequestSchema = z.object({
  jobId: z.string().min(1),
  jobDescription: z.string().min(1),
  persona: z.string().min(1),
  userProfile: userProfileSchema,
  title: z.string().optional(),
  company: z.string().optional(),
});

export type ProposalRequestBody = z.infer<typeof proposalRequestSchema>;
