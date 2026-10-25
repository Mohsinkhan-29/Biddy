import { useJobAnalysis } from "../hooks/useJobAnalysis";
import { StatBox, Pill, ProgressBar } from "./StatBox";
import type { ScrapedJob } from "@shared/types";

interface IntelligenceSheetProps {
  job: ScrapedJob;
}

type Tone = "good" | "warn" | "bad";

const scoreTone = (n: number): Tone => (n >= 65 ? "good" : n >= 40 ? "warn" : "bad");
const scoreWord = (n: number) => (n >= 80 ? "Excellent fit" : n >= 65 ? "Worth a bid" : n >= 40 ? "Proceed with care" : "Likely skip");

export function IntelligenceSheet({ job }: IntelligenceSheetProps) {
  const { analysis, aiStatus } = useJobAnalysis(job);
  const { local, ai } = analysis;

  // on-device analysis is always present; this only guards the type
  if (!ai) return null;

  const bid = ai.bidScore ?? 50;
  const hasConnectData = local.connectEfficiency > 0;

  const scopeTone: Tone =
    ai.scopeCreepRisk === "High Risk" ? "bad" : ai.scopeCreepRisk === "Medium Risk" ? "warn" : "good";

  const sentimentTone: Tone =
    ai.reviewSentiment === "Potential Stress Environment"
      ? "bad"
      : ai.reviewSentiment === "Neutral"
        ? "warn"
        : "good";

  const green = ai.greenFlags ?? [];
  const red = ai.redFlags ?? [];

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-biddy-border bg-biddy-surface p-4 text-biddy-text shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1 bg-biddy-accent" />

      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-biddy-accentHover">
          Biddy Intelligence Sheet
        </span>

        <div className="flex items-center gap-2">
          {aiStatus === "checking" && (
            <span className="flex items-center gap-1 text-[10px] text-biddy-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-biddy-accent" />
              Refining…
            </span>
          )}
          {analysis.aiChecked && (
            <span className="text-[10px] font-semibold text-biddy-accentHover">✓ AI checked</span>
          )}
          <Pill tone={scoreTone(bid)}>
            Bid Score {bid} · {scoreWord(bid)}
          </Pill>
        </div>
      </div>

      {/* ROW 1 */}
      <div className="mb-2 grid grid-cols-3 gap-2">
        <StatBox label="Client Verification">
          {local.clientVerification === "Verified" ? (
            <span>
              <span className="text-biddy-accentHover">✓</span> Payment Verified
            </span>
          ) : (
            <span className="text-biddy-warn">⚠ Not verified</span>
          )}
        </StatBox>

        <StatBox label="Competitor Range">
          <div className="pt-0.5">
            <ProgressBar percent={local.competitorRangePercent} />
            <div className="mt-1 text-right text-[11px] font-normal text-biddy-muted">
              {local.competitorRangeLabel}
            </div>
          </div>
        </StatBox>

        <StatBox label="Review Sentiment">
          <Pill tone={sentimentTone}>{ai.reviewSentiment}</Pill>
          <p className="mt-1 text-[11px] font-normal leading-snug text-biddy-muted">
            {ai.reviewSentimentReason}
          </p>
        </StatBox>
      </div>

      {/* ROW 2 */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <StatBox label="Scope Creep">
          <span className="mr-1.5">{ai.scopeCreepPercent}%</span>
          <Pill tone={scopeTone}>{ai.scopeCreepRisk}</Pill>
        </StatBox>

        <StatBox label="Client Persona">{ai.clientPersona}</StatBox>

        {hasConnectData ? (
          <StatBox label="Connect Efficiency">
            {local.connectEfficiency.toFixed(3)} Connects / $
          </StatBox>
        ) : (
          <StatBox label="Suggested Bid">
            {ai.suggestedRate ? (
              <span className="text-[13px] leading-snug">{ai.suggestedRate}</span>
            ) : (
              <span className="text-biddy-muted">Quote after a quick call</span>
            )}
          </StatBox>
        )}
      </div>

      {/* FLAGS */}
      {(green.length > 0 || red.length > 0) && (
        <div className="mb-3 grid grid-cols-2 gap-2 text-[12px] leading-snug">
          <ul className="space-y-1">
            {green.map((f) => (
              <li key={f} className="flex gap-1.5">
                <span className="text-biddy-accentHover">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1">
            {red.map((f) => (
              <li key={f} className="flex gap-1.5">
                <span className="text-biddy-danger">⚠</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PROPOSAL MOVE */}
      <div className="space-y-1.5 rounded-md border border-dashed border-biddy-accent/30 bg-biddy-accent/5 p-2.5 text-xs">
        <div className="text-biddy-text">
          <span className="mr-1">💡</span>
          <span className="font-semibold text-biddy-accentHover">Biddy Proposal Move:</span>{" "}
          {ai.biddyProposalMove}
        </div>

        {ai.openingHook && (
          <div className="text-biddy-text">
            <span className="mr-1">✍️</span>
            <span className="font-semibold text-biddy-accentHover">Opening line:</span>{" "}
            <span className="italic">“{ai.openingHook}”</span>
          </div>
        )}
      </div>
    </div>
  );
}