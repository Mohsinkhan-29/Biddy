// Sanity check for the on-device insight engine: npx tsx scripts/check-insights.ts
import { computeInsights } from "../src/shared/utils/insights";
import type { ScrapedJob } from "../src/shared/types";

const mk = (o: Omit<Partial<ScrapedJob>, "client"> & { client?: Partial<ScrapedJob["client"]> }): ScrapedJob => ({
  jobId: "x",
  url: "u",
  title: "",
  description: "",
  proposalsTier: "",
  budgetType: "hourly",
  connectsRequired: 0,
  ...o,
  client: { paymentVerified: true, identityVerified: false, ...o.client },
});

const jobs = {
  csharp: mk({ jobId: "022114408957630378396", title: "C# Desktop Tool Modification", description: "This is a quick job. I have a calculator built in C# using .net framework 4.5 which displays a grid of numbers based on your input values. 1) I want to be able to add a color picker to study the relationships 2) Add arrows and arcs on top of the grid. Looking for a quick turnaround.", budgetMin: 10, budgetMax: 20, proposalsTier: "50+", postedAt: "20 hours ago", client: { totalSpent: 0, location: "Canada" } }),
  shopify: mk({ jobId: "022114135938490091605", title: "Shopify products are not showing in the shopping cart on mobile", description: "Essentially, our website has two different products. The customize products works fine on desktop. However, after they click add to cart on mobile, it does not show the products in the cart. If they click the refresh button, everything does show up in the cart.", proposalsTier: "20 to 50", postedAt: "18 hours ago", client: { totalSpent: 3200 } }),
  hiring: mk({ jobId: "02219", title: "We're Hiring: Full-Stack Developer + UI/UX App Designer", description: "We're looking for a talented Full-Stack Developer to help us build an online 1-to-1 language learning platform, including web and mobile app, admin panel, payments, scheduling and more. Long-term opportunity. Contact me on WhatsApp.", budgetMin: 5, budgetMax: 10, proposalsTier: "10 to 15", postedAt: "2 hours ago", client: { totalSpent: 0, location: "Egypt" } }),
  unverified: mk({ jobId: "a1", title: "Need cheap logo ASAP", description: "Need a logo. Cheap. Must deliver today, no excuses. Unpaid test task first.", budgetType: "fixed", budgetMax: 30, proposalsTier: "Less than 5", postedAt: "15 minutes ago", client: { paymentVerified: false } }),
};

for (const [name, job] of Object.entries(jobs)) {
  const r = computeInsights(job);
  console.log(name, r.bidScore, r.scopeCreepRisk, "|", r.clientPersona, "|", r.biddyProposalMove);
}

const check = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`check failed: ${msg}`);
};
check(JSON.stringify(computeInsights(jobs.csharp)) === JSON.stringify(computeInsights(jobs.csharp)), "deterministic");
check(computeInsights(jobs.unverified).redFlags!.length === 3, "red flags capped at 3");
check(computeInsights(jobs.hiring).scopeCreepRisk === "High Risk", "vague platform build = high scope risk");
check(computeInsights(jobs.unverified).bidScore! < computeInsights(jobs.shopify).bidScore!, "bad job scores lower");
check(/diagnos|root cause|cause of/i.test(computeInsights(jobs.shopify).biddyProposalMove), "bug report detected");
console.log("all checks passed");