/** Computed locally, synchronously, with no network call. */
export interface LocalMetrics {
  clientVerification:
  | "Verified"
  | "Verification Pending";

  /**
   * Connects per normalized budget unit.
   * Lower is better.
   *
   * 0 means connects data is unavailable.
   */
  connectEfficiency: number;

  /**
   * Competition level based on proposal tier.
   */
  competitorRangeLabel: string;

  /**
   * 0-100.
   * Drives the competition progress bar.
   */
  competitorRangePercent: number;

  /**
   * Locally inferred from client history.
   */
  clientPersona: string;

  /**
   * Locally inferred from rating/review history.
   */
  reviewSentiment:
  | "Very Positive"
  | "Positive"
  | "Mostly Positive"
  | "Mixed"
  | "Potentially Negative"
  | "No Review History";
}

/** Returned by the backend's /analyze endpoint (Gemini-inferred). */
export interface AiMetrics {
  scopeCreepPercent: number;

  scopeCreepRisk:
  | "Low Risk"
  | "Medium Risk"
  | "High Risk";

  reviewSentiment:
  | "Consistently Positive"
  | "Neutral"
  | "Potential Stress Environment";

  reviewSentimentReason: string;

  clientPersona: string;

  biddyProposalMove: string;

  /** 0-100 — how worth bidding this job is. */
  bidScore?: number;

  /** Short, specific positives / warnings ("Client spent $25K+ on Upwork"). */
  greenFlags?: string[];
  redFlags?: string[];

  /** e.g. "$18/hr — upper end, competition is light". */
  suggestedRate?: string;

  /** Premium: a ready-to-use first sentence for the proposal. */
  openingHook?: string;
}

export interface JobAnalysis {
  jobId: string;

  local: LocalMetrics;

  /**
   * null while the AI request is still in flight
   * or when no AI analysis is available.
   */
  ai: AiMetrics | null;

  /** true once a paid plan's Gemini pass has refined `ai`. */
  aiChecked?: boolean;

  analyzedAt: number;
}

export interface ProposalDraftRequest {
  jobId: string;

  jobDescription: string;

  persona: string;

  userProfile: UserProfile;

  /** Saved with the proposal in the user's history. */
  title?: string;
}

export interface ProposalDraftResponse {
  draft: string;
}

export interface UserProfile {
  skillsSummary: string;

  resumeSummary: string;

  hourlyRate?: number;

  tone:
  | "concise"
  | "warm"
  | "formal";
}