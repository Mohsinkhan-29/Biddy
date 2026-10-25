import type { UserProfile } from "../types/job.types.js";

export function buildProposalPrompt(
  jobDescription: string,
  persona: string,
  profile: UserProfile,
): string {
  return `Write an Upwork proposal for the freelancer described below, for the job described below.

JOB DESCRIPTION:
${jobDescription}

CLIENT PERSONA: ${persona}
(Match your opening and pacing to this persona — e.g. a "Direct / High Velocity" client wants the pleasantries skipped and a concrete solution led with; a "Detail-Oriented / Cautious" client wants clarity and specifics up front.)

FREELANCER PROFILE:
- Skills: ${profile.skillsSummary}
- Background: ${profile.resumeSummary}
${profile.hourlyRate ? `- Rate: $${profile.hourlyRate}/hr` : ""}

TONE: ${profile.tone}

Write a proposal of 120-180 words. No generic filler ("I am excited to apply..."). Lead with relevant proof or a concrete point of view on the project. End with a clear, low-friction call to action. Return plain text only, no markdown formatting.`;
}
