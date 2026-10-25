interface MetricRowProps {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  loading?: boolean;
}

const TONE_CLASSES: Record<NonNullable<MetricRowProps["tone"]>, string> = {
  neutral: "text-biddy-text",
  good: "text-biddy-accent",
  warn: "text-biddy-warn",
  bad: "text-biddy-danger",
};

export function MetricRow({ label, value, tone = "neutral", loading }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-biddy-border/60 last:border-0">
      <span className="text-xs text-biddy-muted">{label}</span>
      {loading ? (
        <span className="h-3 w-20 rounded bg-biddy-border animate-pulse" />
      ) : (
        <span className={`text-xs font-medium ${TONE_CLASSES[tone]}`}>{value}</span>
      )}
    </div>
  );
}
