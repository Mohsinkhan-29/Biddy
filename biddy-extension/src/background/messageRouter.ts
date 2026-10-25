import { analyzeJobRemote, generateProposalRemote } from "./api/biddyApiClient";
import { getCachedAnalysis, setCachedAnalysis } from "./cache/jobCache";
import { getConfig, setConfig } from "@shared/utils/storage";
import { loginWithGoogle, logout, checkAuth } from "./authService";
import { authedFetch } from "./api/httpClient";
import { getStoredUser } from "@shared/utils/authStorage";
import { planOf, PLANS } from "@shared/plans";
import type { BiddyMessage, BiddyResponse } from "@shared/types";

// ponytail: one Gemini call at a time so a feed of 20 cards doesn't trip the
// backend/Gemini per-minute limits; raise to a small pool if latency hurts.
let analyzeQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = analyzeQueue.then(fn, fn);
  analyzeQueue = run.catch(() => {});
  return run;
}

export function registerMessageRouter() {
  chrome.runtime.onMessage.addListener((message: BiddyMessage, _sender, sendResponse) => {
    if ((message as { type: string }).type === "DEBUG_SELECTORS_RESULT") return false;
    handle(message)
      .then((data) => sendResponse({ ok: true, data } satisfies BiddyResponse))
      .catch((err: Error) => sendResponse({ ok: false, error: err.message } satisfies BiddyResponse));

    return true; // keep the message channel open for the async response
  });
}

async function handle(message: BiddyMessage) {
  switch (message.type) {
    case "ANALYZE_JOB": {
      const { job, forceRefresh } = message;
      const plan = planOf((await getStoredUser())?.plan);

      // free plan: the sheet's on-device analysis is the whole answer —
      // null tells the caller "nothing to merge", no backend, no tokens
      if (!PLANS[plan].ai) return null;

      // plan in the key: an upgrade to premium shouldn't reuse standard results
      const key = `${plan}:${job.jobId}`;
      return enqueue(async () => {
        // checked inside the queue so duplicate cards hit the cache
        if (!forceRefresh) {
          const cached = await getCachedAnalysis(key);
          if (cached) return cached;
        }
        const ai = await analyzeJobRemote(job);
        await setCachedAnalysis(key, ai);
        return ai;
      });
    }

    case "GET_USAGE":
      return authedFetch("/api/user/usage", { method: "GET" });

    case "GENERATE_PROPOSAL":
      return generateProposalRemote(message.request);

    case "GET_CONFIG":
      return getConfig();

    case "SET_CONFIG":
      return setConfig(message.config);

    case "CHECK_AUTH":
      return checkAuth();

    case "LOGIN_GOOGLE":
      return loginWithGoogle();

    case "LOGOUT":
      await logout();
      return { loggedOut: true };

    default:
      throw new Error(`Unhandled message type: ${(message as { type: string }).type}`);
  }
}