export function textOf(root: ParentNode, selector: string): string {
  return root.querySelector(selector)?.textContent?.trim() ?? "";
}

export function exists(root: ParentNode, selector: string): boolean {
  return root.querySelector(selector) !== null;
}

/** "$1,500" -> 1500, "$25K+" -> 25000, "$1.2M" -> 1200000 */
export function parseMoney(raw: string): number | undefined {
  const match = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*([KkMm])?/);
  if (!match) return undefined;
  const mult = { k: 1e3, m: 1e6 }[match[2]?.toLowerCase() as "k" | "m"] ?? 1;
  return Number(match[1]) * mult;
}

/** Visible text with line breaks (innerText), falling back to textContent. */
export function visibleText(root: ParentNode): string {
  const el = root as HTMLElement;
  return el.innerText || el.textContent || "";
}

/** Text of every element with no element children, in document order. */
export function leafTexts(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll("*"))
    .filter((e) => e.children.length === 0)
    .map((e) => e.textContent?.trim() ?? "")
    .filter(Boolean);
}

/**
 * Upwork's newer tiles/panels put budget, spend etc. in untagged spans,
 * so these read them off the visible text when no selector matches.
 */
export const fromText = {
  budget: (t: string) =>
    t.match(/(?:Hourly|Fixed[- ]price)(?::?\s*\$[\d,.]+(?:\s*-\s*\$[\d,.]+)?)?/i)?.[0] ?? "",
  spent: (t: string) =>
    t.match(/\$[\d,.]+\s*[KkMm]?\+?\s*(?:total\s+)?spent/i)?.[0] ?? "",
  posted: (t: string) => t.match(/Posted\s+([^•\n]+)/i)?.[1]?.trim() ?? "",
  proposals: (t: string) =>
    t.match(/Proposals:?\s*(Less than 5|5 to 10|10 to 15|15 to 20|20 to 50|50\+)/i)?.[1] ?? "",
  paymentVerified: (t: string) => /payment (method )?verified/i.test(t),
};

/** Leaf right after the "$X spent" leaf, if it looks like a place name. */
export function locationAfterSpent(root: ParentNode): string {
  const leaves = leafTexts(root);
  const i = leaves.findIndex((l) => /spent$/i.test(l));
  const next = i >= 0 ? leaves[i + 1] : undefined;
  return next && /^[A-Za-z][A-Za-z .,'()-]{1,40}$/.test(next) ? next : "";
}

/** Longest paragraph-ish block: the job description on tiles without a tag. */
export function longestBlock(root: ParentNode): string {
  const blocks = Array.from(
    root.querySelectorAll('p, [class*="line-clamp" i], [class*="description" i]'),
  ).map((e) => e.textContent?.trim() ?? "");
  const pool = blocks.length ? blocks : leafTexts(root);
  return pool.reduce((a, b) => (b.length > a.length ? b : a), "");
}

export function parsePercent(raw: string): number | undefined {
  const match = raw.match(/[\d.]+/);
  return match ? Number(match[0]) / 100 : undefined;
}

/** Extracts Upwork's job id from a job URL, e.g. .../~0123456789abcdef/ */
export function parseJobIdFromUrl(url: string): string {
  // Feed slide-over URLs carry the id URL-encoded inside ?job-details-viewer=
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    /* malformed escape — use raw */
  }
  const match = decoded.match(/~([a-zA-Z0-9]+)/);
  return match ? match[1] : url;
}