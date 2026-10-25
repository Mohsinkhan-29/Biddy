/** Everything you may want to change about the site lives here. */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/** Put your built extension zip at public/downloads/biddy-extension.zip */
export const EXTENSION_ZIP = "/downloads/biddy-extension.zip";

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

/**
 * How people pay you for now. Shown on the account page next to the upgrade
 * form. TODO: replace these with your real details before going live.
 */
export const PAYMENT_METHODS: { name: string; details: string[] }[] = [
  { name: "Bank transfer", details: ["Account title: YOUR NAME", "Bank: YOUR BANK", "IBAN: YOUR IBAN"] },
  { name: "JazzCash / Easypaisa", details: ["Number: 03XX-XXXXXXX", "Name: YOUR NAME"] },
];

export type PlanId = "free" | "standard" | "premium";

export const PLANS: Record<
  PlanId,
  { name: string; price: string; monthly: number; sheet: string; analysis: string; proposals: string; model: string }
> = {
  free: {
    name: "Free",
    price: "$0",
    monthly: 0,
    sheet: "Instant analysis on every job",
    analysis: "Bid score, flags, scope and persona",
    proposals: "Not included",
    model: "None",
  },
  standard: {
    name: "Standard",
    price: "$10",
    monthly: 10,
    sheet: "Instant analysis, then an AI check",
    analysis: "AI-refined scope, sentiment and persona",
    proposals: "100 a month",
    model: "Standard Gemini model",
  },
  premium: {
    name: "Premium",
    price: "$25",
    monthly: 25,
    sheet: "Deep AI analysis on every job",
    analysis: "AI bid score, flags, rate and an opening line",
    proposals: "Unlimited",
    model: "Higher-tier Gemini model",
  },
};
