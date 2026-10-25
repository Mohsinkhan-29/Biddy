import { useEffect, useState } from "react";
import { computeLocalMetrics } from "@shared/utils/metrics";
import { computeInsights } from "@shared/utils/insights";
import { updateAnalysis } from "@content/analysisRegistry";

import type {
  ScrapedJob,
  JobAnalysis,
  AiMetrics,
  BiddyMessage,
  BiddyResponse,
} from "@shared/types";

/**
 * "instant"  — on-device analysis showing (free plan: final state)
 * "checking" — paid plan, Gemini check in flight
 * "checked"  — Gemini check merged in
 * "error"    — Gemini check failed; on-device analysis stays visible
 */
export type AiStatus = "instant" | "checking" | "checked" | "error";

function initial(job: ScrapedJob): JobAnalysis {
  return {
    jobId: job.jobId,
    local: computeLocalMetrics(job),
    ai: computeInsights(job),
    aiChecked: false,
    analyzedAt: Date.now(),
  };
}

export function useJobAnalysis(job: ScrapedJob) {
  const [analysis, setAnalysis] = useState<JobAnalysis>(() => initial(job));
  const [aiStatus, setAiStatus] = useState<AiStatus>("instant");
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const base = initial(job);
    setAnalysis(base);
    setAiError(null);
    setAiStatus("checking");
    updateAnalysis(job.jobId, base.ai!);

    const message: BiddyMessage = { type: "ANALYZE_JOB", job };

    chrome.runtime.sendMessage(message, (response: BiddyResponse<AiMetrics | null>) => {
      if (cancelled) return;

      if (!response || !response.ok) {
        setAiError(
          response && !response.ok
            ? response.error
            : (chrome.runtime.lastError?.message ?? "No response from background worker"),
        );
        setAiStatus("error");
        return;
      }

      // free plan — on-device analysis is the final answer
      if (!response.data) {
        setAiStatus("instant");
        return;
      }

      // AI wins where it answered; on-device fields fill anything it left out
      const merged: AiMetrics = { ...base.ai!, ...stripEmpty(response.data) };

      setAnalysis((prev) =>
        prev.jobId !== job.jobId ? prev : { ...prev, ai: merged, aiChecked: true, analyzedAt: Date.now() },
      );
      updateAnalysis(job.jobId, merged);
      setAiStatus("checked");
    });

    return () => {
      cancelled = true;
    };
  }, [job.jobId]);

  return { analysis, aiStatus, aiError };
}

/** Drop empty strings/arrays so a sparse AI answer doesn't blank good on-device fields. */
function stripEmpty(ai: AiMetrics): Partial<AiMetrics> {
  return Object.fromEntries(
    Object.entries(ai).filter(([, v]) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0)),
  ) as Partial<AiMetrics>;
}