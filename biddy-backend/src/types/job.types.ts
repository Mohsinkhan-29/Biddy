export interface ScrapedClient {
  paymentVerified: boolean;
  identityVerified: boolean;
  totalSpent?: number;
  hireRate?: number;
  jobsPosted?: number;
  location?: string;
  recentFeedbackText?: string;
}

export interface ScrapedJob {
  jobId: string;
  url: string;
  title: string;
  description: string;
  budgetType: "fixed" | "hourly";
  budgetMin?: number;
  budgetMax?: number;
  proposalsTier: string;
  connectsRequired: number;
  postedAt?: string;
  client: ScrapedClient;
}

export interface AiMetrics {
  scopeCreepPercent: number;
  scopeCreepRisk: "Low Risk" | "Medium Risk" | "High Risk";
  reviewSentiment: "Consistently Positive" | "Neutral" | "Potential Stress Environment";
  reviewSentimentReason: string;
  clientPersona: string;
  biddyProposalMove: string;
  // premium (deep) analysis only
  bidScore?: number;
  greenFlags?: string[];
  redFlags?: string[];
  suggestedRate?: string;
  openingHook?: string;
}

export interface UserProfile {
  skillsSummary: string;
  resumeSummary: string;
  hourlyRate?: number;
  tone: "concise" | "warm" | "formal";
}