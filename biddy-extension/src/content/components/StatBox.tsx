interface StatBoxProps {
  label: string;
  children: React.ReactNode;
  loading?: boolean;
}

/** One tile in the Intelligence Sheet's metric grid (e.g. "Client Verification"). */
export function StatBox({ label, children, loading }: StatBoxProps) {
  return (
    <div className="rounded-md bg-biddy-surfaceMuted p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-biddy-muted mb-1.5">
        {label}
      </div>
      {loading ? (
        <div className="h-4 w-3/4 rounded bg-biddy-border animate-pulse" />
      ) : (
        <div className="text-sm font-semibold text-biddy-text">{children}</div>
      )}
    </div>
  );
}

interface PillProps {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: React.ReactNode;
}

const PILL_TONE_CLASSES: Record<NonNullable<PillProps["tone"]>, string> = {
  good: "bg-biddy-accent/10 text-biddy-accentHover",
  warn: "bg-biddy-warn/10 text-biddy-warn",
  bad: "bg-biddy-danger/10 text-biddy-danger",
  neutral: "bg-biddy-border text-biddy-text",
};

/** Small rounded badge — used for the header risk badge and sentiment values. */
export function Pill({ tone = "neutral", children }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PILL_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

interface ProgressBarProps {
  percent: number; // 0-100
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full rounded-full bg-biddy-border overflow-hidden">
      <div
        className="h-full rounded-full bg-biddy-accent"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
