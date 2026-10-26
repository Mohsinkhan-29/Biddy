/** Raw facts pulled straight off the Upwork DOM — no inference involved. */
export interface ScrapedClient {
  paymentVerified: boolean;

  identityVerified: boolean;

  totalSpent?: number;

  /**
   * 0-1
   *
   * Example:
   * "85% hire rate" -> 0.85
   */
  hireRate?: number;

  jobsPosted?: number;

  location?: string;

  recentFeedbackText?: string;

  /** Average stars from past freelancers (0-5); present means the client has hired before. */
  rating?: number;
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

  /**
   * Not always exposed by the current Upwork DOM.
   */
  connectsRequired?: number;

  postedAt?: string;

  client: ScrapedClient;
}