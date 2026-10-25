import { authedFetch } from "./httpClient";
import type { ScrapedJob, AiMetrics, ProposalDraftRequest, ProposalDraftResponse } from "@shared/types";

/**
 * The extension never talks to Gemini directly — it talks to YOUR Node
 * backend, which holds the Gemini API key server-side. This keeps the key
 * out of the extension bundle entirely (extension code is fully readable
 * by anyone who installs it). Every call here rides on the signed-in user's
 * JWT (see httpClient.ts), which is also how the backend attributes usage
 * and proposal/analysis history to the right account.
 */

export function analyzeJobRemote(job: ScrapedJob): Promise<AiMetrics> {
  return authedFetch<AiMetrics>("/api/analyze", { body: { job } });
}

export function generateProposalRemote(
  request: ProposalDraftRequest,
): Promise<ProposalDraftResponse> {
  return authedFetch<ProposalDraftResponse>("/api/proposal", { body: request });
}
