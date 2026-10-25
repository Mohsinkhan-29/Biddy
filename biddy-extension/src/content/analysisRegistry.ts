import type { AiMetrics } from "@shared/types";

export interface BiddyFilters {
  hideHighRiskCreep: boolean;
  minSentiment: "all" | "positive";
}

interface RegistryEntry {
  cardEl: Element;
  ai: AiMetrics | null;
}

const registry = new Map<string, RegistryEntry>();

let currentFilters: BiddyFilters = {
  hideHighRiskCreep: false,
  minSentiment: "all",
};

/** Called once per card when it's first mounted (before AI analysis lands). */
export function registerCard(jobId: string, cardEl: Element): void {
  const existing = registry.get(jobId);
  registry.set(jobId, { cardEl, ai: existing?.ai ?? null });
}

/** Called by useJobAnalysis once the AI fields arrive for a job. */
export function updateAnalysis(jobId: string, ai: AiMetrics): void {
  const entry = registry.get(jobId);
  if (!entry) return;
  entry.ai = ai;
  applyFilters(currentFilters);
}

/** Called by filterControls.ts whenever the user changes a filter. */
export function setFilters(filters: BiddyFilters): void {
  currentFilters = filters;
  applyFilters(currentFilters);
}

export function getFilters(): BiddyFilters {
  return currentFilters;
}

export function applyFilters(filters: BiddyFilters): void {
  registry.forEach(({ cardEl, ai }) => {
    // don't hide cards whose AI analysis hasn't landed yet — better to
    // show a still-loading card than to disappear it based on no data
    if (!ai) return;

    let shouldHide = false;
    if (filters.hideHighRiskCreep && ai.scopeCreepRisk === "High Risk") {
      shouldHide = true;
    }
    if (filters.minSentiment === "positive" && ai.reviewSentiment !== "Consistently Positive") {
      shouldHide = true;
    }

    (cardEl as HTMLElement).style.display = shouldHide ? "none" : "";
  });
}
