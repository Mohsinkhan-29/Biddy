import { SELECTORS } from "./domSelectors";
import { scrapeFeedCard } from "./feedCardScraper";
import type { ScrapedJob } from "@shared/types";

type OnNewJobs = (jobs: Array<{ card: Element; job: ScrapedJob }>) => void;

/**
 * Watches the job feed container for cards added by Upwork's infinite
 * scroll and reports newly-seen ones exactly once each.
 */
const JOB_LINK = 'a[href*="/jobs/"][href*="~"]';

/**
 * Configured card selector first. If Upwork serves a layout it doesn't
 * match, fall back to "nearest article/section around each job title link",
 * skipping containers that hold more than one job (that's the list, not a card).
 */
function findCards(): Element[] {
  const direct = document.querySelectorAll(SELECTORS.feed.jobCard);
  if (direct.length) return Array.from(direct);

  const cards = new Set<Element>();
  document.querySelectorAll(JOB_LINK).forEach((a) => {
    const card = a.parentElement?.closest("article, section");
    if (!card) return;
    const ids = new Set(
      Array.from(card.querySelectorAll<HTMLAnchorElement>(JOB_LINK)).map(
        (l) => l.href.match(/~([a-zA-Z0-9]+)/)?.[1],
      ),
    );
    if (ids.size === 1) cards.add(card);
  });
  return Array.from(cards);
}

/** A card already has a sheet if our mount point sits right after it. */
function hasSheet(card: Element): boolean {
  return (card.nextElementSibling as HTMLElement | null)?.dataset.biddyMount !== undefined;
}

export function startFeedScanner(onNewJobs: OnNewJobs): () => void {
  const scanNow = () => {
    const cards = findCards();
    const fresh: Array<{ card: Element; job: ScrapedJob }> = [];

    // keyed on the card element, not the job id: when Upwork re-renders the
    // list it creates new card nodes, and those need a sheet again
    const live = new Set(cards);
    const claimed = new Set<string>();
    for (const card of cards) {
      if (hasSheet(card)) continue;
      const job = scrapeFeedCard(card);
      if (!job || claimed.has(job.jobId)) continue;
      // same job already has a sheet on another live card (e.g. feed card +
      // open slide-over) — leave it, or the two would steal it back and forth
      const owner = document.querySelector(
        `[data-biddy-mount="${CSS.escape(job.jobId)}"]`,
      )?.previousElementSibling;
      if (owner && live.has(owner)) continue;
      claimed.add(job.jobId);
      fresh.push({ card, job });
    }

    if (fresh.length) {
      console.log(`[Biddy] feed scan: ${cards.length} card(s), ${fresh.length} new`);
      onNewJobs(fresh);
    }
  };

  const observer = new MutationObserver(() => scanNow());
  observer.observe(document.body, { childList: true, subtree: true });

  // initial pass for cards already on the page before the observer attached
  scanNow();

  return () => observer.disconnect();
}