import { SELECTORS } from "./domSelectors";
import {
  textOf,
  exists,
  parseMoney,
  parsePercent,
  parseJobIdFromUrl,
  visibleText,
  fromText,
  locationAfterSpent,
  longestBlock,
} from "./scrapeHelpers";
import type { ScrapedJob } from "@shared/types";

function findJobLink(card: Element): HTMLAnchorElement | null {
  const specific = card.querySelector<HTMLAnchorElement>(
    SELECTORS.jobCard.title,
  );

  if (specific?.href) {
    return specific;
  }

  const anchors = Array.from(
    card.querySelectorAll<HTMLAnchorElement>("a[href]"),
  );

  return (
    anchors.find((a) => /~\d{6,}/.test(a.href)) ?? null
  );
}

function findOpeningUid(card: Element): string | null {
  // new tiles keep it on an inner .impression-tracker span, old ones on the card
  const uid =
    card.getAttribute("data-ev-opening_uid") ??
    card.querySelector("[data-ev-opening_uid]")?.getAttribute("data-ev-opening_uid") ??
    null;

  return uid && /^\d+$/.test(uid) ? uid : null;
}

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

  // Extract all dollar amounts from:
  // "Hourly: $15-$30"
  // "Fixed-price: $500"
  // "$15 - $30"
  const amounts = value.match(/\$[\d,]+(?:\.\d+)?/g) ?? [];

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

function reportEmptyFields(job: ScrapedJob): void {
  const empty: string[] = [];

  if (!job.title) {
    empty.push("title (jobCard.title)");
  }

  if (!job.description) {
    empty.push("description (jobCard.description)");
  }

  if (!job.budgetMin && !job.budgetMax) {
    empty.push("budget (jobCard.budget)");
  }

  if (!job.proposalsTier) {
    empty.push("proposalsTier (jobCard.proposalsTier)");
  }

  if (!job.postedAt) {
    empty.push("postedAt (jobCard.postedAt)");
  }

  if (!job.client.totalSpent) {
    empty.push("client.totalSpent (jobCard.clientSpend)");
  }

  if (!job.client.location) {
    empty.push("client.location (jobCard.clientLocation)");
  }

  // These are NOT present in the supplied Upwork card.
  if (!job.connectsRequired) {
    console.debug(
      "[Biddy] connectsRequired is not present in the current feed card.",
    );
  }

  if (!job.client.hireRate) {
    console.debug(
      "[Biddy] client.hireRate is not present in the current feed card.",
    );
  }

  if (empty.length) {
    console.warn(
      "[Biddy] scrapeFeedCard: card found, but these confirmed fields came back empty:\n  - " +
      empty.join("\n  - "),
    );
  }
}

export function scrapeFeedCard(
  card: Element,
): ScrapedJob | null {
  const linkEl = findJobLink(card);
  const openingUid = findOpeningUid(card);

  if (!linkEl && !openingUid) {
    console.warn(
      "[Biddy] card matched the container selector but has neither " +
      "a job link nor a data-ev-opening_uid",
      card,
    );
    return null;
  }

  // Upwork's public job key is "~02" + opening uid (same id the job page URL
  // and the slide-over carry), so feed and detail share one cache entry.
  // ponytail: "02" prefix holds for current postings; old "~01" keys only
  // show up via linkEl, which is preferred when present.
  const jobId = linkEl
    ? parseJobIdFromUrl(linkEl.href)
    : `02${openingUid}`;

  const url = linkEl?.href ?? `https://www.upwork.com/jobs/~${jobId}/`;

  const text = visibleText(card);

  const title =
    textOf(card, SELECTORS.jobCard.title) ||
    linkEl?.textContent?.trim() ||
    "";

  const budget = parseBudget(
    textOf(card, SELECTORS.jobCard.budget) || fromText.budget(text),
  );

  const job: ScrapedJob = {
    jobId,
    url,
    title,

    description:
      textOf(card, SELECTORS.jobCard.description) || longestBlock(card),

    budgetType: budget.type,
    budgetMin: budget.min,
    budgetMax: budget.max,

    proposalsTier:
      textOf(card, SELECTORS.jobCard.proposalsTier) || fromText.proposals(text),

    // feed tiles never show connects — only the job page does
    connectsRequired: 0,

    postedAt: textOf(card, SELECTORS.jobCard.postedAt) || fromText.posted(text),

    client: {
      paymentVerified:
        exists(card, SELECTORS.jobCard.paymentVerified) ||
        fromText.paymentVerified(text),

      identityVerified: exists(card, SELECTORS.jobCard.identityVerified),

      totalSpent: parseMoney(
        textOf(card, SELECTORS.jobCard.clientSpend) || fromText.spent(text),
      ),

      hireRate: parsePercent(textOf(card, SELECTORS.jobCard.clientHireRate)),

      location:
        textOf(card, SELECTORS.jobCard.clientLocation) || locationAfterSpent(card),
    },
  };

  reportEmptyFields(job);

  return job;
}