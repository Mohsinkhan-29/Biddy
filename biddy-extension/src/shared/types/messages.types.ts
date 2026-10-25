import type { ScrapedJob, ProposalDraftRequest } from ".";

/** Every message the content/sidebar/popup layers can send to the background worker. */
export type BiddyMessage =
  | { type: "ANALYZE_JOB"; job: ScrapedJob; forceRefresh?: boolean }
  | { type: "GENERATE_PROPOSAL"; request: ProposalDraftRequest }
  | { type: "GET_CONFIG" }
  | { type: "SET_CONFIG"; config: Record<string, unknown> }
  | { type: "SCRAPE_CURRENT_JOB" }
  | { type: "CHECK_AUTH" }
  | { type: "GET_USAGE" }
  | { type: "LOGIN_GOOGLE" }
  | { type: "LOGOUT" };

export type BiddyResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };