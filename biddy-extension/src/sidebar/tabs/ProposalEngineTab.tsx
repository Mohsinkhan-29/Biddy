import { useCallback, useEffect, useState } from "react";
import { getConfig } from "@shared/utils/storage";
import { computeInsights } from "@shared/utils/insights";
import { PLANS, planOf } from "@shared/plans";

// VITE_WEBSITE_URL in biddy-extension/.env — where upgrades happen
const WEBSITE_URL = (import.meta.env.VITE_WEBSITE_URL || "http://localhost:3000").replace(/\/+$/, "");
import type { BiddyMessage, BiddyResponse, ProposalDraftResponse, ScrapedJob } from "@shared/types";

export function ProposalEngineTab({ plan: rawPlan }: { plan: string }) {
  const plan = planOf(rawPlan);
  const limit = PLANS[plan].proposalsPerMonth;

  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState<number | null>(null);

  const loadUsage = useCallback(() => {
    if (!Number.isFinite(limit) || limit === 0) return;
    const message: BiddyMessage = { type: "GET_USAGE" };
    chrome.runtime
      .sendMessage(message)
      .then((r: BiddyResponse<{ proposalsGenerated: number }>) => r.ok && setUsed(r.data.proposalsGenerated))
      .catch(() => undefined);
  }, [limit]);

  useEffect(loadUsage, [loadUsage]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) {
        setError("No active tab found.");
        return;
      }

      const job: ScrapedJob | undefined = await chrome.tabs.sendMessage(activeTab.id, {
        type: "SCRAPE_CURRENT_JOB",
      });
      if (!job) {
        setError(
          "Couldn't read this job page. Make sure you're on an Upwork job posting, and check domSelectors.ts against the live DOM.",
        );
        return;
      }

      const config = await getConfig();
      const message: BiddyMessage = {
        type: "GENERATE_PROPOSAL",
        request: {
          jobId: job.jobId,
          jobDescription: job.description,
          persona: computeInsights(job).clientPersona,
          userProfile: config.userProfile,
          title: job.title,
        },
      };

      const response: BiddyResponse<ProposalDraftResponse> = await chrome.runtime.sendMessage(message);
      if (response.ok) {
        setDraft(response.data.draft);
        loadUsage();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the content script — is this tab on upwork.com?",
      );
    } finally {
      setLoading(false);
    }
  }, [loadUsage]);

  if (limit === 0) {
    return (
      <div className="rounded-xl border border-biddy-border bg-biddy-surface p-4 text-xs leading-relaxed">
        <p className="text-sm font-bold text-biddy-text mb-1">🔒 Proposal Engine</p>
        <p className="text-biddy-muted mb-3">
          Drafts a tailored proposal for the job you're viewing, matched to the client's persona and your profile.
        </p>
        <ul className="space-y-1 text-biddy-text">
          <li>
            <b>{PLANS.standard.label}</b> · {PLANS.standard.price} — {PLANS.standard.proposalsPerMonth} proposals / month
          </li>
          <li>
            <b>{PLANS.premium.label}</b> · {PLANS.premium.price} — unlimited, higher-tier model
          </li>
        </ul>
        <button
          onClick={() => chrome.tabs.create({ url: `${WEBSITE_URL}/account?plan=standard` })}
          className="mt-4 w-full rounded-md bg-biddy-accent py-2 text-xs font-semibold text-biddy-bg"
        >
          Upgrade on the Biddy website
        </button>
      </div>
    );
  }

  const outOfQuota = used !== null && used >= limit;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-biddy-muted">
        {Number.isFinite(limit)
          ? `${used ?? "…"} of ${limit} proposals used this month`
          : "Unlimited proposals · Premium"}
      </p>
      <button
        onClick={generate}
        disabled={loading || outOfQuota}
        className="w-full rounded-md bg-biddy-accent text-biddy-bg text-xs font-semibold py-2 disabled:opacity-50"
      >
        {loading ? "Drafting…" : outOfQuota ? "Monthly limit reached" : "Generate Proposal"}
      </button>

      {error && <p className="text-xs text-biddy-danger leading-snug">{error}</p>}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Your drafted proposal will appear here — fully editable."
        className="w-full h-64 resize-none rounded-md border border-biddy-border bg-biddy-surface p-2 text-xs text-biddy-text placeholder:text-biddy-muted focus:outline-none focus:ring-1 focus:ring-biddy-accent"
      />

      <div className="flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(draft)}
          disabled={!draft}
          className="flex-1 rounded-md border border-biddy-border text-xs py-2 disabled:opacity-40"
        >
          Copy
        </button>
        <button
          onClick={generate}
          disabled={loading || outOfQuota}
          className="flex-1 rounded-md border border-biddy-border text-xs py-2 disabled:opacity-40"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
