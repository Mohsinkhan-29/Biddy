import type { ScrapedJob } from "@shared/types";
import { SELECTORS } from "./domSelectors";

/* =========================================================
   TEXT
   ========================================================= */

function getText(
  root: Element,
  selector: string,
): string {
  return (
    root
      .querySelector(selector)
      ?.textContent
      ?.replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

/* =========================================================
   NUMBER
   ========================================================= */

/**
 * Converts common Upwork numeric values.
 *
 * Examples:
 *
 * "$25K+"      -> 25000
 * "$1,500"     -> 1500
 * "23"         -> 23
 * "23 reviews" -> 23
 */
function parseNumber(
  value: string,
): number | undefined {
  const text = value.trim();

  if (!text) {
    return undefined;
  }

  const match = text.match(
    /(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/,
  );

  if (!match) {
    return undefined;
  }

  let number = Number(
    match[1].replace(/,/g, ""),
  );

  if (!Number.isFinite(number)) {
    return undefined;
  }

  const afterNumber =
    text
      .slice(
        (match.index ?? 0) +
          match[1].length,
      )
      .trim();

  const suffix =
    afterNumber
      .charAt(0)
      .toUpperCase();

  if (suffix === "K") {
    number *= 1_000;
  }

  if (suffix === "M") {
    number *= 1_000_000;
  }

  return number;
}

/* =========================================================
   HIRE RATE
   ========================================================= */

/**
 * ScrapedClient.hireRate is 0-1.
 *
 * Examples:
 *
 * "85%" -> 0.85
 * "72% hire rate" -> 0.72
 * "100%" -> 1
 */
function parseHireRate(
  value: string,
): number | undefined {
  const number = parseNumber(value);

  if (number === undefined) {
    return undefined;
  }

  if (number < 0 || number > 100) {
    return undefined;
  }

  return number / 100;
}

/* =========================================================
   JOBS POSTED
   ========================================================= */

/**
 * Examples:
 *
 * "24 jobs posted" -> 24
 * "24" -> 24
 */
function parseJobsPosted(
  value: string,
): number | undefined {
  const number = parseNumber(value);

  if (
    number === undefined ||
    number < 0
  ) {
    return undefined;
  }

  return Math.floor(number);
}

/* =========================================================
   BUDGET
   ========================================================= */

/**
 * Examples:
 *
 * "$15-$30/hr"
 *
 * {
 *   type: "hourly",
 *   min: 15,
 *   max: 30
 * }
 *
 * "$500"
 *
 * {
 *   type: "fixed",
 *   min: 500,
 *   max: 500
 * }
 */
function parseBudget(
  value: string,
): {
  type: "fixed" | "hourly";
  min?: number;
  max?: number;
} {
  const text = value
    .replace(/\s+/g, " ")
    .trim();

  const matches = [
    ...text.matchAll(
      /\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(K|M)?/gi,
    ),
  ];

  const numbers = matches
    .map((match) => {
      let number = Number(
        match[1].replace(/,/g, ""),
      );

      const suffix =
        match[2]?.toUpperCase();

      if (suffix === "K") {
        number *= 1_000;
      }

      if (suffix === "M") {
        number *= 1_000_000;
      }

      return number;
    })
    .filter(Number.isFinite);

  const isHourly =
    /\/\s*hr|\/\s*hour|per\s+hour|hourly/i.test(
      text,
    );

  return {
    type: isHourly
      ? "hourly"
      : "fixed",

    min: numbers[0],

    max:
      numbers.length > 1
        ? numbers[1]
        : numbers[0],
  };
}

/* =========================================================
   JOB ID
   ========================================================= */

/**
 * Extracts the Upwork job ID from the job URL.
 *
 * Example:
 *
 * https://www.upwork.com/jobs/~022089788150853859159
 *
 * =>
 *
 * 022089788150853859159
 */
function extractJobId(
  url: string,
): string {
  if (!url) {
    return "";
  }

  const match = url.match(
    /\/jobs\/~([a-zA-Z0-9_-]+)/,
  );

  if (match?.[1]) {
    return match[1];
  }

  const fallback =
    url.match(
      /~([a-zA-Z0-9_-]+)/,
    );

  return fallback?.[1] ?? "";
}

/* =========================================================
   JOB CARD PARSER
   ========================================================= */

export function parseJobCard(
  card: Element,
): ScrapedJob {
  /* -------------------------
     Basic job information
     ------------------------- */

  const title = getText(
    card,
    SELECTORS.jobCard.title,
  );

  const description = getText(
    card,
    SELECTORS.jobCard.description,
  );

  const postedAt =
    getText(
      card,
      SELECTORS.jobCard.postedAt,
    ) || undefined;

  /* -------------------------
     Job URL / ID
     ------------------------- */

  const jobLink =
    card.querySelector(
      SELECTORS.feed.jobLink,
    ) as HTMLAnchorElement | null;

  const url =
    jobLink?.href ?? "";

  const jobId =
    extractJobId(url);

  /* -------------------------
     Budget
     ------------------------- */

  const budgetText =
    getText(
      card,
      SELECTORS.jobCard.budget,
    );

  const budget =
    parseBudget(budgetText);

  /* -------------------------
     Proposals
     ------------------------- */

  const proposalsTier =
    getText(
      card,
      SELECTORS.jobCard.proposalsTier,
    );

  /* -------------------------
     Client verification
     ------------------------- */

  const paymentVerified =
    Boolean(
      card.querySelector(
        SELECTORS.jobCard.paymentVerified,
      ),
    );

  const identityVerified =
    Boolean(
      card.querySelector(
        SELECTORS.jobCard.identityVerified,
      ),
    );

  /* -------------------------
     Client spending
     ------------------------- */

  const clientSpendText =
    getText(
      card,
      SELECTORS.jobCard.clientSpend,
    );

  const totalSpent =
    parseNumber(clientSpendText);

  /* -------------------------
     Client hire rate
     ------------------------- */

  const clientHireRateText =
    getText(
      card,
      SELECTORS.jobCard.clientHireRate,
    );

  const hireRate =
    parseHireRate(
      clientHireRateText,
    );

  /* -------------------------
     Client location
     ------------------------- */

  const location =
    getText(
      card,
      SELECTORS.jobCard.clientLocation,
    ) || undefined;

  /* -------------------------
     Client feedback
     ------------------------- */

  const recentFeedbackText =
    getText(
      card,
      SELECTORS.jobCard.clientFeedback,
    ) || undefined;

  /*
   * The current selector gives us feedback text,
   * so we keep it as text instead of trying to
   * convert it into a number.
   */

  /* -------------------------
     Client jobs posted
     ------------------------- */

  /*
   * There is currently no separate jobsPosted
   * selector in the supplied SELECTORS object.
   *
   * Therefore we intentionally do NOT invent
   * a value here.
   */

  const jobsPosted =
    undefined;

  /* -------------------------
     Connects
     ------------------------- */

  /*
   * The supplied DOM does not reliably expose
   * connectsRequired.
   *
   * Therefore this remains undefined.
   */
  const connectsRequired =
    undefined;

  /* -------------------------
     Final object
     ------------------------- */

  return {
    jobId,

    url,

    title,

    description,

    budgetType:
      budget.type,

    budgetMin:
      budget.min,

    budgetMax:
      budget.max,

    proposalsTier,

    connectsRequired,

    postedAt,

    client: {
      paymentVerified,

      identityVerified,

      totalSpent,

      hireRate,

      jobsPosted,

      location,

      recentFeedbackText,
    },
  };
}