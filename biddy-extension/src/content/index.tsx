import { createRoot, type Root } from "react-dom/client";
import { StrictMode } from "react";

import { startFeedScanner } from "./feedScanner";
import { scrapeJobDetailPage } from "./jobPageScraper";
import { waitForElement } from "./waitForElement";
import { watchUrlChanges } from "./spaNavigation";
import { ShadowHost } from "./components/ShadowHost";
import { IntelligenceSheet } from "./components/IntelligenceSheet";
import { registerCard } from "./analysisRegistry";
import { injectFilterControls } from "./filterControls";
import { SELECTORS } from "./domSelectors";
import { debugSelectors } from "./debugSelector";
import { isLoggedIn } from "@shared/utils/authStorage";

// after Upwork has rendered — at load time every selector reports 0
setTimeout(debugSelectors, 6000);

let stopFeedScanner: (() => void) | null = null;
let jobDetailRoot: Root | null = null;
let jobDetailMountPoint: HTMLElement | null = null;
const feedRoots = new Map<string, Root>();

// Sheets only show for signed-in users (every plan uses Google sign-in).
let loggedIn = false;

function mountSheetAfter(
  card: Element,
  job: Parameters<typeof IntelligenceSheet>[0]["job"]
) {
  registerCard(job.jobId, card);

  // drop a sheet left behind when Upwork re-rendered this job's card
  feedRoots.get(job.jobId)?.unmount();
  document
    .querySelectorAll(`[data-biddy-mount="${CSS.escape(job.jobId)}"]`)
    .forEach((el) => el.remove());

  const mountPoint = document.createElement("div");

  mountPoint.dataset.biddyMount = job.jobId;

  card.insertAdjacentElement("afterend", mountPoint);

  const root = createRoot(mountPoint);
  feedRoots.set(job.jobId, root);

  root.render(
    <StrictMode>
      <ShadowHost>
        <IntelligenceSheet job={job} />
      </ShadowHost>
    </StrictMode>
  );
}

function initFeedPage() {
  stopFeedScanner?.();

  injectFilterControls();

  stopFeedScanner = startFeedScanner((newJobs) => {
    for (const { card, job } of newJobs) {
      mountSheetAfter(card, job);
    }

    injectFilterControls();
  });
}

function teardownJobDetailSheet() {
  jobDetailRoot?.unmount();

  jobDetailRoot = null;

  jobDetailMountPoint?.remove();

  jobDetailMountPoint = null;
}

async function initJobDetailPage() {
  teardownJobDetailSheet();

  const titleEl = await waitForElement("h1");

  if (!titleEl) return;

  const job = scrapeJobDetailPage();

  if (!job) return;

  const container =
    document.querySelector(SELECTORS.jobDetailPage.root) ??
    titleEl.parentElement ??
    document.body;

  const mountPoint = document.createElement("div");

  container.prepend(mountPoint);

  jobDetailMountPoint = mountPoint;

  jobDetailRoot = createRoot(mountPoint);

  jobDetailRoot.render(
    <StrictMode>
      <ShadowHost>
        <IntelligenceSheet job={job} />
      </ShadowHost>
    </StrictMode>
  );
}

/** Remove everything Biddy added to the page — used on logout. */
function teardownAll() {
  stopFeedScanner?.();
  stopFeedScanner = null;
  teardownJobDetailSheet();
  feedRoots.forEach((root) => root.unmount());
  feedRoots.clear();
  document.querySelectorAll("[data-biddy-mount]").forEach((el) => el.remove());
  ["biddy-filter-action-btn", "biddy-filter-panel"].forEach((id) => document.getElementById(id)?.remove());
}

function route(pathname: string) {
  if (!loggedIn) return;

  const isFeedPage = /\/(search|find-work)\//.test(pathname);

  const isJobDetailPage = /\/jobs\/~/.test(pathname);

  if (!isJobDetailPage) {
    teardownJobDetailSheet();
  }

  if (!isFeedPage && stopFeedScanner) {
    stopFeedScanner();
    stopFeedScanner = null;
  }

  if (isFeedPage) {
    initFeedPage();
  }

  if (isJobDetailPage) {
    initJobDetailPage();
  }
}

async function init() {
  loggedIn = await isLoggedIn();
  route(window.location.pathname);

  // login / logout in the popup takes effect on open tabs right away
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local" || !("biddy_access_token" in changes)) return;
    const now = await isLoggedIn();
    if (now === loggedIn) return; // token refresh, not a login/logout
    loggedIn = now;
    if (now) route(window.location.pathname);
    else teardownAll();
  });

  watchUrlChanges((url) => {
    route(new URL(url).pathname);
  });

  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message?.type === "SCRAPE_CURRENT_JOB") {
        sendResponse(loggedIn ? scrapeJobDetailPage() : null);
      }
    }
  );
}

init();