import type { ScrapedJob, LocalMetrics } from "@shared/types";

/**
 * Local metrics only.
 *
 * No API calls.
 * No AI.
 * No network requests.
 */
export function computeLocalMetrics(
  job: ScrapedJob,
): LocalMetrics {
  const competitorRange =
    computeCompetitorRange(job);

  return {
    clientVerification:
      computeVerification(job),

    connectEfficiency:
      computeConnectEfficiency(job),

    competitorRangeLabel:
      competitorRange.label,

    competitorRangePercent:
      competitorRange.percent,

    clientPersona:
      computeClientPersona(job),

    reviewSentiment:
      computeReviewSentiment(job),
  };
}

/* =========================================================
   CLIENT VERIFICATION
   ========================================================= */

function computeVerification(
  job: ScrapedJob,
): LocalMetrics["clientVerification"] {
  return job.client.paymentVerified === true
    ? "Verified"
    : "Verification Pending";
}

/* =========================================================
   CONNECT EFFICIENCY
   ========================================================= */

function computeConnectEfficiency(
  job: ScrapedJob,
): number {
  const connects = job.connectsRequired;

  /*
   * Your supplied Upwork DOM does not guarantee
   * connectsRequired.
   */
  if (
    typeof connects !== "number" ||
    !Number.isFinite(connects) ||
    connects <= 0
  ) {
    return 0;
  }

  const normalizedBudget =
    normalizeBudget(job);

  if (
    typeof normalizedBudget !== "number" ||
    !Number.isFinite(normalizedBudget) ||
    normalizedBudget <= 0
  ) {
    return 0;
  }

  return Number(
    (
      connects / normalizedBudget
    ).toFixed(3),
  );
}

/* =========================================================
   BUDGET
   ========================================================= */

function normalizeBudget(
  job: ScrapedJob,
): number | undefined {
  const min = job.budgetMin;
  const max = job.budgetMax;

  /*
   * Fixed-price:
   * Prefer maximum budget.
   */
  if (job.budgetType === "fixed") {
    if (
      typeof max === "number" &&
      Number.isFinite(max) &&
      max > 0
    ) {
      return max;
    }

    if (
      typeof min === "number" &&
      Number.isFinite(min) &&
      min > 0
    ) {
      return min;
    }

    return undefined;
  }

  /*
   * Hourly:
   * Use midpoint × 40 hours.
   */
  if (job.budgetType === "hourly") {
    let hourlyRate: number | undefined;

    if (
      typeof min === "number" &&
      typeof max === "number" &&
      Number.isFinite(min) &&
      Number.isFinite(max)
    ) {
      hourlyRate =
        (min + max) / 2;
    } else if (
      typeof max === "number" &&
      Number.isFinite(max)
    ) {
      hourlyRate = max;
    } else if (
      typeof min === "number" &&
      Number.isFinite(min)
    ) {
      hourlyRate = min;
    }

    if (
      typeof hourlyRate === "number" &&
      hourlyRate > 0
    ) {
      return hourlyRate * 40;
    }
  }

  return undefined;
}

/* =========================================================
   COMPETITION
   ========================================================= */

const TIER_WEIGHT: Record<
  string,
  number
> = {
  "Less than 5": 1,
  "5 to 10": 2,
  "10 to 15": 3,
  "15 to 20": 4,
  "20 to 50": 5,
  "50+": 6,
};

function computeCompetitorRange(
  job: ScrapedJob,
): {
  label: string;
  percent: number;
} {
  const proposalsTier =
    typeof job.proposalsTier === "string"
      ? job.proposalsTier.replace(/^\s*proposals:?\s*/i, "").trim()
      : "";

  const weight =
    TIER_WEIGHT[proposalsTier] ?? 3;

  const percent = Math.round(
    (weight / 6) * 100,
  );

  if (weight <= 2) {
    return {
      label: "Low competition",
      percent,
    };
  }

  if (weight <= 4) {
    return {
      label: "Moderate competition",
      percent,
    };
  }

  return {
    label: "High competition",
    percent,
  };
}

/* =========================================================
   CLIENT PERSONA
   ========================================================= */

function computeClientPersona(
  job: ScrapedJob,
): string {
  const client = job.client;
  const spend = client.totalSpent ?? 0;
  // undefined = Upwork didn't show it (feed tiles never do) — not 0%
  const hr = client.hireRate;
  const feedback = client.recentFeedbackText?.trim() ?? "";
  const verified = client.paymentVerified === true;

  if (spend === 0 && !hr && !feedback) return "New Client";
  if (verified && spend >= 10000 && (hr === undefined || hr >= 0.7)) return "High-Intent Buyer";
  if (verified && spend >= 5000 && (hr === undefined || hr >= 0.6)) return "Reliable Professional";
  if (hr !== undefined && spend >= 5000 && hr < 0.5) return "Selective Buyer";
  if (spend < 1000 && (hr === undefined || hr < 0.4)) return "Budget Conscious";
  return "Standard Client";
}

/* =========================================================
   REVIEW SENTIMENT
   ========================================================= */

function computeReviewSentiment(
  job: ScrapedJob,
): LocalMetrics["reviewSentiment"] {
  const feedback =
    job.client.recentFeedbackText
      ?.trim()
      .toLowerCase() ?? "";

  if (!feedback) {
    return "No Review History";
  }

  /*
   * Positive review keywords.
   */
  const positiveWords = [
    "great",
    "excellent",
    "good",
    "amazing",
    "professional",
    "perfect",
    "helpful",
    "responsive",
    "excellent work",
    "highly recommend",
    "recommend",
    "fantastic",
    "outstanding",
    "wonderful",
    "easy to work with",
  ];

  /*
   * Negative / stressful review keywords.
   */
  const negativeWords = [
    "poor",
    "bad",
    "terrible",
    "difficult",
    "unresponsive",
    "disappointed",
    "disappointing",
    "late",
    "delay",
    "delayed",
    "issue",
    "issues",
    "problem",
    "problems",
    "refund",
    "unprofessional",
    "frustrating",
    "frustrated",
    "miscommunication",
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of positiveWords) {
    if (feedback.includes(word)) {
      positiveScore++;
    }
  }

  for (const word of negativeWords) {
    if (feedback.includes(word)) {
      negativeScore++;
    }
  }

  /*
   * No meaningful sentiment detected.
   */
  if (
    positiveScore === 0 &&
    negativeScore === 0
  ) {
    return "Mixed";
  }

  /*
   * Strongly positive.
   */
  if (
    positiveScore >= 3 &&
    positiveScore > negativeScore
  ) {
    return "Very Positive";
  }

  /*
   * Positive.
   */
  if (
    positiveScore > negativeScore
  ) {
    return "Positive";
  }

  /*
   * Strong negative signals.
   */
  if (
    negativeScore >= 2 &&
    negativeScore > positiveScore
  ) {
    return "Potentially Negative";
  }

  /*
   * Some negative signal but not enough
   * to classify as strongly negative.
   */
  if (
    negativeScore > positiveScore
  ) {
    return "Mixed";
  }

  return "Mixed";
}

/* =========================================================
   SAFE NUMBER
   ========================================================= */

function safeNumber(
  value: unknown,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return value;
}