import { SELECTORS } from "./domSelectors";
import {
  textOf,
  exists,
  parseMoney,
  parsePercent,
  parseJobIdFromUrl,
  visibleText,
  fromText,
} from "./scrapeHelpers";
import type { ScrapedJob } from "@shared/types";

/** First element matching the comma-list, tried in the order written. */
function findRoot(): Element | null {
  for (const sel of SELECTORS.jobDetailPage.root.split(",")) {
    const el = document.querySelector(sel.trim());
    if (el) return el;
  }
  return null;
}

/**
 * Configured selector first, then the first heading inside the root
 * (the slide-over panel uses a non-h1 heading), then any h1 on the page.
 */
function findTitle(root: ParentNode): string {
  return (
    textOf(root, SELECTORS.jobDetailPage.title) ||
    // only inside a real details root — on the feed's <main> the first
    // heading is a section header, not the job title
    (root instanceof Element && !root.matches("main#main-content, body")
      ? root.querySelector("h1, h2, h3, h4")?.textContent?.trim()
      : "") ||
    document.querySelector("h1")?.textContent?.trim() ||
    ""
  );
}

/** Configured selector, else the block under a "Summary" heading. */
function findDescription(root: ParentNode): string {
  const bySelector = textOf(root, SELECTORS.jobDetailPage.description);
  if (bySelector) return bySelector;

  const heading = Array.from(root.querySelectorAll("h2, h3, h4, h5")).find(
    (h) => h.textContent?.trim().toLowerCase() === "summary",
  );
  const block = heading?.parentElement?.textContent?.trim() ?? "";
  return block.replace(/^summary\s*/i, "").trim();
}

/**
 * Parses Upwork budget strings such as:
 *
 *   Hourly: $15-$30
 *   Hourly: $15 - $30
 *   Fixed-price: $500
 *   $500
 */
function parseBudget(raw: string): {
  type: "hourly" | "fixed";
  min: number;
  max: number;
} {
  const value = raw.trim();

  if (!value) {
    return {
      type: "fixed",
      min: 0,
      max: 0,
    };
  }

  const isHourly = /^hourly\b/i.test(value);

  const amounts = value.match(
    /\$[\d,]+(?:\.\d+)?/g,
  ) ?? [];

const parsed = amounts
  .map((amount) => parseMoney(amount))
  .filter((amount): amount is number => Number.isFinite(amount));

if (parsed.length >= 2) {
  const [min, max] = parsed;

  return {
    type: isHourly ? "hourly" : "fixed",
    min: min!,
    max: max!,
  };
}

if (parsed.length === 1) {
  const [min] = parsed;

  return {
    type: isHourly ? "hourly" : "fixed",
    min: min!,
    max: min!,
  };
}

  return {
    type: isHourly ? "hourly" : "fixed",
    min: 0,
    max: 0,
  };
}

/**
 * Selector first, else Upwork's sidebar copy:
 * "Send a proposal for: 16 Connects" / "Required Connects to submit a proposal: 16"
 */
function parseConnects(root: ParentNode): number {
  const bySelector = Number(textOf(root, SELECTORS.jobCard.connects).match(/\d+/)?.[0]);
  if (bySelector) return bySelector;

  const text = (root as Element).textContent ?? document.body.textContent ?? "";
  const m =
    text.match(/proposal for:?\s*(\d+)\s*connects/i) ??
    text.match(/connects to submit a proposal:?\s*(\d+)/i);
  return m ? Number(m[1]) : 0;
}

/**
 * Scrapes the currently opened Upwork job detail page.
 */
export function scrapeJobDetailPage(): ScrapedJob | null {
  const configuredRoot = findRoot();

  const root = configuredRoot ?? document.body;

  const usedFallbackRoot = !configuredRoot;

  const title = findTitle(root);

  if (!title) {
    console.warn(
      "[Biddy] scrapeJobDetailPage: no title found. " +
        "Checked SELECTORS.jobDetailPage.title and <h1>. " +
        "This may not be a job page or Upwork's markup may have changed.",
    );

    return null;
  }

  if (usedFallbackRoot) {
    console.warn(
      `[Biddy] scrapeJobDetailPage: root selector "${SELECTORS.jobDetailPage.root}" ` +
        "did not match. Falling back to document.body.",
    );
  }

  /*
   * Upwork may use the same data-test="job-type" element
   * on the detail page.
   *
   * Example:
   *
   * Hourly: $15-$30
   */
  const text = visibleText(root);

  const budgetRaw =
    textOf(root, SELECTORS.jobCard.budget) || fromText.budget(text);

  const budget = parseBudget(budgetRaw);

  /*
   * Client feedback is not necessarily a single element.
   * Grab the first non-empty feedback item.
   */
  const feedbackEls = root.querySelectorAll(
    SELECTORS.jobDetailPage.clientFeedback,
  );

  const recentFeedbackText =
    Array.from(feedbackEls)
      .map((el) => el.textContent?.trim() ?? "")
      .find(Boolean) ?? "";

  /*
   * Prefer the job ID from the current URL.
   */
  const jobId = parseJobIdFromUrl(
    window.location.href,
  );

  if (!jobId) {
    console.warn(
      "[Biddy] scrapeJobDetailPage: unable to extract job ID from URL:",
      window.location.href,
    );

    return null;
  }

  const job: ScrapedJob = {
    jobId,

    url: window.location.href,

    title,

    description: findDescription(root),

    budgetType: budget.type,

    budgetMin: budget.min,

    budgetMax: budget.max,

    /*
     * These values are currently based on selectors
     * confirmed in the supplied feed markup.
     *
     * If the detail page uses different data-test attributes,
     * add detail-page-specific selectors later.
     */
    proposalsTier:
      textOf(root, SELECTORS.jobCard.proposalsTier) || fromText.proposals(text),

    // Current supplied markup does not expose connects.
    connectsRequired: parseConnects(root),

    postedAt:
      textOf(root, SELECTORS.jobCard.postedAt) || fromText.posted(text),

    client: {
      paymentVerified:
        exists(root, SELECTORS.jobCard.paymentVerified) ||
        fromText.paymentVerified(text),

      /*
       * FIXED:
       *
       * Previously this incorrectly checked:
       * SELECTORS.jobCard.paymentVerified
       */
      identityVerified: exists(
        root,
        SELECTORS.jobCard.identityVerified,
      ),

      totalSpent: parseMoney(
        textOf(root, SELECTORS.jobCard.clientSpend) || fromText.spent(text),
      ),

      hireRate: parsePercent(
        textOf(
          root,
          SELECTORS.jobCard.clientHireRate,
        ),
      ),

      location: textOf(
        root,
        SELECTORS.jobCard.clientLocation,
      ),

      recentFeedbackText,
    },
  };

  reportEmptyFields(job);

  return job;
}

/**
 * Reports missing fields without treating currently unavailable
 * Upwork fields as selector failures.
 */
function reportEmptyFields(
  job: ScrapedJob,
): void {
  const empty: string[] = [];

  if (!job.description) {
    empty.push(
      "description (jobDetailPage.description)",
    );
  }

  if (!job.budgetMin && !job.budgetMax) {
    empty.push(
      "budget (jobCard.budget)",
    );
  }

  if (!job.proposalsTier) {
    empty.push(
      "proposalsTier (jobCard.proposalsTier)",
    );
  }

  if (!job.postedAt) {
    empty.push(
      "postedAt (jobCard.postedAt)",
    );
  }

  if (!job.client.totalSpent) {
    empty.push(
      "client.totalSpent (jobCard.clientSpend)",
    );
  }

  if (!job.client.location) {
    empty.push(
      "client.location (jobCard.clientLocation)",
    );
  }

  /*
   * These fields are not present in the HTML you supplied,
   * so don't report them as selector failures.
   */
  if (!job.connectsRequired) {
    console.debug(
      "[Biddy] connectsRequired is not present in the current Upwork markup.",
    );
  }

  if (!job.client.hireRate) {
    console.debug(
      "[Biddy] client.hireRate is not present in the current Upwork markup.",
    );
  }

  if (empty.length) {
    console.debug(
      "[Biddy] scrapeJobDetailPage: title found, but these " +
        "confirmed fields came back empty:\n  - " +
        empty.join("\n  - "),
    );
  }
}