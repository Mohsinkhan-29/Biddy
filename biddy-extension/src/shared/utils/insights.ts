import type { AiMetrics, ScrapedJob } from "@shared/types";

/**
 * Biddy's on-device analyst (free plan, and the instant first pass on paid
 * plans before the Gemini check lands).
 *
 * Reads the brief the way a seasoned freelancer would — clarity vs. vagueness,
 * scope inflation, budget fit, client track record, competition, red flags —
 * and writes its conclusions from the job's own words, so every sheet reads
 * like it was written for that job.
 *
 * Deterministic: the same job always gets the same wording (variants are
 * picked from a hash of the job id), so cards don't "change their mind"
 * on re-render.
 */
export function computeInsights(job: ScrapedJob): AiMetrics {
  const s = readSignals(job);

  const scope = scoreScope(s);
  const sentiment = readSentiment(s);
  const persona = readPersona(s);
  const { green, red } = collectFlags(s);
  const bidScore = scoreBid(s, scope.percent, red.length);

  return {
    scopeCreepPercent: scope.percent,
    scopeCreepRisk: scope.risk,
    reviewSentiment: sentiment.label,
    reviewSentimentReason: sentiment.reason,
    clientPersona: persona,
    biddyProposalMove: proposalMove(s, scope.percent),
    bidScore,
    greenFlags: green.slice(0, 3),
    redFlags: red.slice(0, 3),
    suggestedRate: suggestRate(s),
  };
}

/* =========================================================
   SIGNALS — everything later steps reason about
   ========================================================= */

const TECH: Record<string, string> = {
  react: "React", "next.js": "Next.js", nextjs: "Next.js", vue: "Vue", angular: "Angular",
  svelte: "Svelte", node: "Node.js", "node.js": "Node.js", express: "Express",
  typescript: "TypeScript", javascript: "JavaScript", python: "Python", django: "Django",
  flask: "Flask", fastapi: "FastAPI", php: "PHP", laravel: "Laravel", wordpress: "WordPress",
  shopify: "Shopify", liquid: "Liquid", woocommerce: "WooCommerce", webflow: "Webflow",
  "c#": "C#", ".net": ".NET", java: "Java", kotlin: "Kotlin", swift: "Swift",
  flutter: "Flutter", "react native": "React Native", figma: "Figma", tailwind: "Tailwind",
  postgres: "PostgreSQL", postgresql: "PostgreSQL", mysql: "MySQL", mongodb: "MongoDB",
  firebase: "Firebase", supabase: "Supabase", aws: "AWS", docker: "Docker", stripe: "Stripe",
  graphql: "GraphQL", "rest api": "REST API", openai: "OpenAI", langchain: "LangChain",
  n8n: "n8n", zapier: "Zapier", selenium: "Selenium", "power bi": "Power BI", excel: "Excel",
};

interface Signals {
  id: string;
  title: string;
  topic: string;
  text: string; // lowercase description
  words: number;
  bullets: number;
  questions: number;
  tech: string[];
  deliverables: string[];
  vague: string[];
  bigScope: string[];
  urgent: string[];
  demanding: string[];
  friendly: string[];
  unpaidTest: string | null;
  offPlatform: string | null;
  lowBallCue: string | null;
  equityCue: string | null;
  longTerm: string | null;
  isFix: boolean;
  hourly: boolean;
  budgetLow?: number;
  budgetHigh?: number;
  proposals: number; // 1 (<5) … 6 (50+), 0 unknown
  proposalsLabel: string;
  freshHours?: number;
  verified: boolean;
  spent: number;
  hireRate?: number;
  location?: string;
  feedback: string;
}

const OFF_PLATFORM_NAME: Record<string, string> = {
  whatsapp: "WhatsApp", telegram: "Telegram", skype: "Skype", "@gmail.com": "email",
  "discord me": "Discord", "outside upwork": "outside channels", "off upwork": "outside channels",
};

const find = (text: string, phrases: string[]) => phrases.filter((p) => text.includes(p));
const first = (text: string, phrases: string[]) => phrases.find((p) => text.includes(p)) ?? null;

function readSignals(job: ScrapedJob): Signals {
  const raw = `${job.description ?? ""}`;
  const text = raw.toLowerCase();
  const title = (job.title ?? "").trim();

  const tech = Array.from(
    new Set(
      Object.entries(TECH)
        .filter(([k]) => new RegExp(`(^|[^a-z])${escapeRe(k)}([^a-z]|$)`).test(`${text} ${title.toLowerCase()}`))
        .map(([, v]) => v),
    ),
  );

  const tierIndex = ["less than 5", "5 to 10", "10 to 15", "15 to 20", "20 to 50", "50+"];
  const tier = (job.proposalsTier ?? "").toLowerCase().replace(/^\s*proposals:?\s*/, "").trim();
  const proposals = tierIndex.indexOf(tier) + 1;

  return {
    id: job.jobId,
    title,
    topic: topicOf(title),
    text,
    words: raw.split(/\s+/).filter(Boolean).length,
    // "- item" / "• item" lines, plus inline "1) … 2) …" numbering
    bullets: (raw.match(/(^|\n)\s*[-*•]\s+|(^|\s)\d{1,2}[.)]\s+/g) ?? []).length,
    questions: (raw.match(/\?/g) ?? []).length,
    tech,
    deliverables: find(text, [
      "deliverable", "milestone", "acceptance", "requirements", "must have", "spec",
      "wireframe", "mockup", "figma", "documentation", "timeline", "deadline", "scope",
    ]),
    vague: find(text, [
      " etc", "and more", "various", "multiple features", "many features", "everything",
      "all kinds", "and so on", "other features", "many more", "a lot of", "whatever",
    ]),
    bigScope: find(text, [
      "platform", "marketplace", "from scratch", "full stack", "full-stack", "end to end",
      "end-to-end", "admin panel", "dashboard", "mobile app", "web and mobile", "saas",
      "like uber", "like airbnb", "like amazon", "like fiverr", "clone", "complete system",
      "entire", "crm", "erp",
    ]),
    urgent: find(text, [
      "asap", "urgent", "urgently", "immediately", "today", "tonight", "within 24",
      "quick turnaround", "right away", "by tomorrow",
    ]).concat(/urgent|asap/i.test(title) ? ["urgent (title)"] : []),
    demanding: find(text, [
      "no excuses", "only serious", "don't apply", "do not apply", "strictly", "must be available",
      "no beginners", "no agencies", "lowest price", "fixed price only", "will not pay",
      "zero tolerance", "!!!",
    ]),
    friendly: find(text, [
      "thank you", "thanks", "looking forward", "appreciate", "happy to", "collaborat",
      "excited", "partner", "long-term relationship", "feel free",
    ]),
    unpaidTest: first(text, ["unpaid test", "free test", "test task", "trial task", "free sample", "sample work for free"]),
    offPlatform: first(text, ["whatsapp", "telegram", "skype", "outside upwork", "off upwork", "@gmail.com", "discord me"]),
    lowBallCue: first(text, ["cheap", "low budget", "tight budget", "lowest", "small budget", "budget is limited"]),
    equityCue: first(text, ["equity", "revenue share", "rev share", "profit share", "paid later"]),
    longTerm: first(text, ["long term", "long-term", "ongoing", "future projects", "more work", "full-time", "full time"]),
    isFix:
      /\b(fix|bug|issue|error|broken|crash|debug|troubleshoot)|not (working|showing|loading|displaying|saving|sending)|doesn'?t work/i.test(title) ||
      /\b(does not|doesn'?t|isn'?t|is not|won'?t) (show|work|load|display|save|send|update)/i.test(raw),
    hourly: job.budgetType === "hourly",
    budgetLow: job.budgetMin || undefined,
    budgetHigh: job.budgetMax || job.budgetMin || undefined,
    proposals,
    proposalsLabel: tier,
    freshHours: hoursAgo(job.postedAt),
    verified: job.client?.paymentVerified === true,
    spent: job.client?.totalSpent ?? 0,
    hireRate: job.client?.hireRate,
    location: job.client?.location || undefined,
    feedback: (job.client?.recentFeedbackText ?? "").toLowerCase(),
  };
}

/* =========================================================
   SCOPE CREEP
   ========================================================= */

function scoreScope(s: Signals): { percent: number; risk: AiMetrics["scopeCreepRisk"] } {
  let p = 22;
  p += s.vague.length * 9;
  p += Math.min(s.bigScope.length, 3) * 9;
  if (s.words < 40) p += 14;
  else if (s.words < 80) p += 6;
  if (!s.deliverables.length) p += 8;
  if (s.longTerm) p += 4;
  if (budgetTooSmall(s)) p += 14;
  if (s.equityCue) p += 10;
  p -= Math.min(s.bullets, 8) * 3;
  p -= Math.min(s.deliverables.length, 4) * 4;
  p -= Math.min(s.tech.length, 5) * 2;
  if (s.isFix) p -= 8; // a bug has a natural finish line

  const percent = clamp(Math.round(p), 5, 95);
  return {
    percent,
    risk: percent >= 62 ? "High Risk" : percent >= 35 ? "Medium Risk" : "Low Risk",
  };
}

function budgetTooSmall(s: Signals): boolean {
  if (!s.budgetHigh) return false;
  const big = s.bigScope.length >= 2;
  return s.hourly ? big && s.budgetHigh <= 12 : big && s.budgetHigh < 400;
}

/* =========================================================
   SENTIMENT — client feedback if Upwork shows it, else the brief's tone
   ========================================================= */

function readSentiment(s: Signals): { label: AiMetrics["reviewSentiment"]; reason: string } {
  if (s.feedback) {
    const good = find(s.feedback, ["great", "excellent", "amazing", "recommend", "professional", "pleasure", "fantastic"]);
    const bad = find(s.feedback, ["poor", "unresponsive", "late", "refund", "disappoint", "difficult", "unprofessional"]);
    if (bad.length > good.length)
      return { label: "Potential Stress Environment", reason: `Past freelancers mention "${bad[0]}" — set expectations in writing early.` };
    if (good.length)
      return { label: "Consistently Positive", reason: `Feedback history leans warm ("${good[0]}"), a good sign for smooth collaboration.` };
  }

  if (s.demanding.length >= 2 || (s.demanding.length && s.urgent.length))
    return {
      label: "Potential Stress Environment",
      reason: `The brief reads high-pressure ("${s.demanding[0]}"${s.urgent[0] ? `, "${s.urgent[0]}"` : ""}) — confirm scope and revisions before starting.`,
    };

  if (s.friendly.length && (s.verified || s.spent > 0))
    return {
      label: "Consistently Positive",
      reason: `Collaborative tone ("${s.friendly[0]}") from a ${s.spent > 0 ? "paying" : "verified"} client.`,
    };

  if (s.spent >= 10000 && s.verified)
    return { label: "Consistently Positive", reason: `${money(s.spent)} spent on Upwork — an experienced, settled buyer.` };

  return {
    label: "Neutral",
    reason: s.spent === 0 ? "No hiring history yet, and the brief is matter-of-fact." : "Businesslike brief with no warning signs in the wording.",
  };
}

/* =========================================================
   PERSONA — two axes: how they work, how fast they move
   ========================================================= */

function readPersona(s: Signals): string {
  const style =
    s.spent === 0 && !s.hireRate
      ? "First-Time Hirer"
      : s.spent >= 25000
        ? "Seasoned Buyer"
        : s.bullets >= 4 || s.deliverables.length >= 3 || s.tech.length >= 4
          ? "Detail-Oriented"
          : s.words < 50 || s.vague.length >= 2
            ? "Big-Picture"
            : "Professional";

  const pace = s.urgent.length
    ? "High Velocity"
    : s.longTerm
      ? "Long-Term Builder"
      : s.questions >= 2
        ? "Consultative"
        : s.words > 220
          ? "Methodical"
          : s.isFix
            ? "Problem-Solver"
            : "Standard";

  if (style === "First-Time Hirer") return pace === "Standard" ? "First-Time Hirer / Needs Guidance" : `First-Time Hirer / ${pace}`;
  return `${style} / ${pace}`;
}

/* =========================================================
   FLAGS
   ========================================================= */

function collectFlags(s: Signals): { green: string[]; red: string[] } {
  const green: string[] = [];
  const red: string[] = [];

  // red first — they matter more
  if (s.unpaidTest) red.push(`Mentions "${s.unpaidTest}" — clarify it's paid before starting`);
  if (s.offPlatform) red.push(`Asks to move to ${OFF_PLATFORM_NAME[s.offPlatform] ?? cap(s.offPlatform)} — keep it on Upwork`);
  if (s.equityCue) red.push(`Offers "${s.equityCue}" instead of cash — treat as unpaid`);
  if (budgetTooSmall(s)) red.push(`${budgetText(s)} for a ${s.bigScope[0]}-sized build — budget doesn't match scope`);
  if (!s.verified) red.push("Payment method not verified yet");
  if (s.lowBallCue) red.push(`Signals price pressure ("${s.lowBallCue}")`);
  if (s.hireRate !== undefined && s.hireRate < 0.35 && s.spent > 0) red.push(`Hires on only ${Math.round(s.hireRate * 100)}% of posts`);
  if (s.proposals >= 6) red.push("50+ proposals already — crowded field");

  if (s.spent >= 10000) green.push(`Client has spent ${money(s.spent)} on Upwork`);
  else if (s.spent >= 1000) green.push(`Proven buyer — ${money(s.spent)} spent`);
  if (s.verified && s.spent === 0) green.push("Verified payment, first project — no competing loyalties");
  if (s.proposals === 1) green.push("Fewer than 5 proposals so far — early mover advantage");
  else if (s.proposals === 2) green.push("Only 5–10 proposals so far — still room to stand out");
  if (s.freshHours !== undefined && s.freshHours <= 3) green.push("Posted within the last few hours");
  if (s.bullets >= 3 || s.deliverables.length >= 3) green.push("Clear, itemised requirements — easy to scope");
  if (s.tech.length >= 2) green.push(`Stack is named up front: ${s.tech.slice(0, 3).join(", ")}`);
  if (s.isFix) green.push("Defined problem with a natural finish line");
  if (s.longTerm && !s.equityCue) green.push(`Hints at ${s.longTerm} work beyond this job`);
  if (s.hireRate !== undefined && s.hireRate >= 0.7) green.push(`Hires on ${Math.round(s.hireRate * 100)}% of posts`);

  return { green, red };
}

/* =========================================================
   BID SCORE
   ========================================================= */

function scoreBid(s: Signals, scope: number, redCount: number): number {
  let score = 50;

  // client quality
  if (s.verified) score += 8;
  else score -= 16;
  if (s.spent >= 25000) score += 12;
  else if (s.spent >= 5000) score += 8;
  else if (s.spent >= 500) score += 4;
  if (s.hireRate !== undefined) score += (s.hireRate - 0.5) * 16;

  // competition + timing
  const comp = [0, 14, 9, 4, 0, -6, -12][s.proposals] ?? 0;
  score += comp;
  if (s.freshHours !== undefined) score += s.freshHours <= 3 ? 6 : s.freshHours >= 48 ? -6 : 0;

  // clarity
  score += (50 - scope) / 5;

  // budget fit
  if (budgetTooSmall(s)) score -= 10;
  if (s.hourly && s.budgetHigh && s.budgetHigh >= 40) score += 5;
  if (!s.hourly && s.budgetHigh && s.budgetHigh >= 1000) score += 5;

  // dealbreakers weigh more than ordinary warnings
  score -= redCount * 6 + (s.unpaidTest ? 12 : 0) + (s.offPlatform ? 10 : 0) + (s.equityCue ? 10 : 0);
  return clamp(Math.round(score), 3, 98);
}

/* =========================================================
   PROPOSAL MOVE — strongest signal wins, phrased for this job
   ========================================================= */

function proposalMove(s: Signals, scope: number): string {
  const pick = (variants: string[]) => variants[hash(s.id) % variants.length];
  const stack = s.tech.slice(0, 2).join(" + ");
  const topic = s.topic || "the project";

  if (s.unpaidTest)
    return pick([
      `Offer a small paid first milestone instead of the ${s.unpaidTest} — it signals confidence and filters out free-work seekers.`,
      `Agree to the ${s.unpaidTest} only as a paid, time-boxed milestone; say so politely in your first line.`,
    ]);

  if (s.isFix)
    return pick([
      `Open by naming the most likely cause of "${topic}" and how you'd confirm it — showing you already understand the bug beats any portfolio link.`,
      `Lead with a 2-step diagnosis plan for "${topic}" and a realistic fix window; problem-solvers win these, not generalists.`,
      `Skip the intro: describe a similar ${stack || "issue"} you've fixed and the root cause it turned out to be.`,
    ]);

  if (budgetTooSmall(s))
    return pick([
      `Budget is tight for this scope — quote a lean phase one (core ${s.bigScope[0]} only) instead of underbidding the whole build.`,
      `Propose an MVP slice that fits ${budgetText(s)} and list what comes in phase two; it protects you and reads as expertise.`,
    ]);

  if (scope >= 62)
    return pick([
      `The brief is open-ended — propose a fixed first milestone with a clear deliverable before quoting the full ${topic}.`,
      `Turn the vague parts into 3 concrete questions in your proposal; clients with loose briefs hire whoever brings structure.`,
      `Suggest a short paid discovery step to lock scope, then estimate — it frames you as the expert, not the cheapest bid.`,
    ]);

  if (s.urgent.length)
    return pick([
      `They need it fast — put a concrete delivery date in your very first sentence.`,
      `Lead with availability ("I can start today") and a same-week delivery plan; speed is the deciding factor here.`,
    ]);

  if (s.proposals >= 5)
    return pick([
      `With ${s.proposalsLabel} proposals in, skip pleasantries — open with one sharp insight about ${topic} and a link to a matching project.`,
      `Stand out in a crowded field: reference a specific detail from their brief in line one, then show one relevant result.`,
    ]);

  if (s.spent === 0)
    return pick([
      `First-time hirer — walk them through your process in 3 short steps; reassurance wins here more than price.`,
      `New to Upwork clients value clarity: outline milestones, communication rhythm and what you need from them.`,
    ]);

  if (s.bullets >= 3 || s.deliverables.length >= 3)
    return pick([
      `The brief is detailed — mirror their own terms${stack ? ` (${stack})` : ""} and answer each requirement point by point.`,
      `Respond to their list in the same order, one line each; detail-oriented clients notice when nothing is skipped.`,
    ]);

  if (s.longTerm)
    return `Pitch this as the first step of an ongoing partnership — mention how you'd handle the ${s.longTerm} work after launch.`;

  return pick([
    `Open with a relevant result${stack ? ` in ${stack}` : ""}, then one specific idea for ${topic} — keep it under 120 words.`,
    `Lead with proof: one similar project, one measurable outcome, one question about their ${topic}.`,
  ]);
}

/* =========================================================
   SUGGESTED RATE
   ========================================================= */

function suggestRate(s: Signals): string | undefined {
  const lo = s.budgetLow;
  const hi = s.budgetHigh;
  if (!hi) return undefined;

  const crowded = s.proposals >= 5;
  const light = s.proposals > 0 && s.proposals <= 2;

  if (s.hourly) {
    const span = (hi - (lo ?? hi)) || hi * 0.2;
    const base = lo ?? hi * 0.8;
    const rate = Math.round(light ? hi : crowded ? base + span * 0.45 : base + span * 0.7);
    const why = light ? "competition is light" : crowded ? "stay competitive in a crowded field" : "upper-middle of their range";
    return `$${rate}/hr — ${why}`;
  }

  const total = Math.round(hi / 5) * 5 || hi;
  return total >= 500
    ? `$${total} in 2–3 milestones — de-risks it for the client`
    : `$${total} fixed — deliver in one milestone`;
}

/* =========================================================
   HELPERS
   ========================================================= */

function topicOf(title: string): string {
  const t = title
    .replace(/^(we'?re hiring:?|hiring:?|urgent:?|need(ed)?|looking for|seeking|wanted:?)\s*/i, "")
    .replace(/\s*[-–|]\s*(urgent|asap).*$/i, "")
    .replace(/[.!]+$/, "")
    .trim();
  // quoting a 12-word title back reads robotic — keep the head of it
  if (t.length <= 48) return t;
  return t.slice(0, 48).replace(/\s+\S*$/, "") + "…";
}

function hoursAgo(posted?: string): number | undefined {
  if (!posted) return undefined;
  const m = posted.toLowerCase().match(/(\d+|a|an)\s*(minute|hour|day|week|month)/);
  if (!m) return /yesterday/.test(posted.toLowerCase()) ? 24 : undefined;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : 1;
  const unit = { minute: 1 / 60, hour: 1, day: 24, week: 168, month: 720 }[m[2] as "hour"];
  return n * unit;
}

function budgetText(s: Signals): string {
  if (!s.budgetHigh) return "the budget";
  if (s.hourly) return s.budgetLow && s.budgetLow !== s.budgetHigh ? `$${s.budgetLow}–$${s.budgetHigh}/hr` : `$${s.budgetHigh}/hr`;
  return `$${s.budgetHigh}`;
}

function money(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}K+` : `$${n}`;
}

function cap(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function escapeRe(t: string): string {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hash(t: string): number {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return h;
}