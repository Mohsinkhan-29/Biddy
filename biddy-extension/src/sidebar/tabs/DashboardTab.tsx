import { useCallback, useState } from "react";
import { MetricRow } from "@content/components/MetricRow";
import { computeLocalMetrics } from "@shared/utils/metrics";
import { computeInsights } from "@shared/utils/insights";
import type { JobAnalysis, ScrapedJob } from "@shared/types";
import type { BiddyMessage, BiddyResponse } from "@shared/types";

export function DashboardTab() {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCurrentTab = useCallback(async () => {
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

      const local = computeLocalMetrics(job);
      const instant = computeInsights(job);
      setAnalysis({ jobId: job.jobId, local, ai: instant, analyzedAt: Date.now() });

      // paid plans: merge the Gemini check over the instant analysis
      // (free plan gets data: null back and keeps the instant one)
      const message: BiddyMessage = { type: "ANALYZE_JOB", job };
      const response: BiddyResponse = await chrome.runtime.sendMessage(message);
      if (response.ok && response.data) {
        setAnalysis({
          jobId: job.jobId,
          local,
          ai: { ...instant, ...(response.data as NonNullable<JobAnalysis["ai"]>) },
          aiChecked: true,
          analyzedAt: Date.now(),
        });
      } else if (!response.ok) {
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
  }, []);

  return (
    <div className="bg-biddy-surfaceMuted p-4 min-h-full">
      <div className="rounded-xl border border-biddy-border bg-biddy-surface p-4 shadow-sm">
        <h2 className="text-sm font-bold text-biddy-text mb-3">
          Target System Status
        </h2>

        <button
          onClick={analyzeCurrentTab}
          disabled={loading}
          className="w-full rounded-lg bg-biddy-accent hover:bg-biddy-accentHover
                     text-white text-sm font-semibold py-3 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing…" : "Analyze Current Job Page"}
        </button>

        {!analysis && !error && (
          <p className="text-xs text-biddy-textMuted leading-snug mt-3">
            Navigate to an individual Upwork job post page and click analyze
            to compute metric ratings.
          </p>
        )}

        {error && (
          <p className="text-xs text-biddy-danger leading-snug mt-3">{error}</p>
        )}
      </div>

      {analysis && (
        <div className="rounded-xl border border-biddy-border bg-biddy-surface p-4 shadow-sm mt-3">
          <MetricRow label="Bid Score" value={`${analysis.ai?.bidScore ?? "—"} / 100${analysis.aiChecked ? " · AI checked" : ""}`} />
          <MetricRow label="Scope Creep" value={`${analysis.ai?.scopeCreepPercent ?? "—"}% (${analysis.ai?.scopeCreepRisk ?? "—"})`} />
          <MetricRow label="Client Verification" value={analysis.local.clientVerification} />
          <MetricRow label="Competitor Range" value={analysis.local.competitorRangeLabel} />
          {analysis.local.connectEfficiency > 0 && (
            <MetricRow label="Connect Efficiency" value={analysis.local.connectEfficiency.toFixed(2)} />
          )}
          <MetricRow label="Review Sentiment" value={analysis.ai?.reviewSentiment ?? "—"} />
          <MetricRow label="Client Persona" value={analysis.ai?.clientPersona ?? "—"} />
          {analysis.ai?.suggestedRate && <MetricRow label="Suggested Bid" value={analysis.ai.suggestedRate} />}
          {analysis.ai?.biddyProposalMove && (
            <p className="mt-3 text-xs leading-snug text-biddy-text">💡 {analysis.ai.biddyProposalMove}</p>
          )}
        </div>
      )}
    </div>
  );
}