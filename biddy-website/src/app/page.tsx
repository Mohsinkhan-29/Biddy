import Link from "next/link";
import { SheetPreview } from "@/components/SheetPreview";
import { PLANS, type PlanId } from "@/lib/config";

const READS: { term: string; example: string; detail: string }[] = [
  {
    term: "Bid score",
    example: "59 · Worth a bid",
    detail: "One number out of 100 that weighs the client, the competition, how clear the brief is and whether the budget fits.",
  },
  {
    term: "Red and green flags",
    example: "Mentions “unpaid test task” — clarify it’s paid before starting",
    detail: "Unpaid tests, off-platform contact, budgets that don’t match the work, unverified payment — and the good signs too.",
  },
  {
    term: "Scope creep",
    example: "43% · Medium risk",
    detail: "How likely the job is to grow past what’s written, judged from vague wording, missing deliverables and scope size.",
  },
  {
    term: "Client persona",
    example: "Professional / Problem-Solver",
    detail: "How this client probably works and how fast they move, so you can match your tone.",
  },
  {
    term: "Proposal move",
    example: "Lead with a 2-step diagnosis plan and a realistic fix window",
    detail: "What to open your proposal with for this particular job.",
  },
];

const ROWS: { label: string; key: "sheet" | "analysis" | "proposals" | "model" }[] = [
  { label: "Intelligence sheet", key: "sheet" },
  { label: "Job analysis", key: "analysis" },
  { label: "Proposals", key: "proposals" },
  { label: "AI model", key: "model" },
];

const PLAN_ORDER: PlanId[] = ["free", "standard", "premium"];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-14">
        <div className="max-w-xl">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">
            Know which Upwork jobs are worth your Connects.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate sm:text-xl">
            Biddy is a Chrome extension that reads every job in your feed and puts a sheet underneath it: how good the
            client is, how crowded the job is, what could go wrong, and how to open your proposal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/download" className="btn-primary px-6 py-3 text-lg">
              Download for Chrome
            </Link>
            <Link href="#plans" className="btn-quiet px-6 py-3 text-lg">
              Compare plans
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate">Free plan included. Sign in with Google.</p>
        </div>
        <SheetPreview />
      </section>

      {/* WHAT THE SHEET READS */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">What you get under every job</h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-slate">
              The sheet appears as you scroll Best matches and Most recent, and again when you open a job. Nothing to
              copy and paste.
            </p>
          </div>
          <dl className="divide-y divide-line">
            {READS.map((r) => (
              <div key={r.term} className="grid gap-1 py-5 first:pt-0 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="font-display text-lg font-semibold">{r.term}</dt>
                <dd>
                  <p className="font-semibold text-leaf-dark">{r.example}</p>
                  <p className="mt-1 leading-relaxed text-slate">{r.detail}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* GET STARTED — an actual sequence, so it's numbered */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">Up and running in two minutes</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            ["Install the extension", "Download it from this site and load it into Chrome."],
            ["Sign in with Google", "Open Biddy from the toolbar and continue with your Google account."],
            ["Open your Upwork feed", "Sheets appear under each job as you scroll. Open any job for more."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="font-display text-4xl font-extrabold leading-none text-leaf">{i + 1}</span>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 leading-relaxed text-slate">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* PLANS */}
      <section id="plans" className="mx-auto max-w-6xl scroll-mt-8 px-4 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">Plans</h2>
        <p className="mt-3 text-lg text-slate">Paid plans are billed monthly. Every plan signs in with Google.</p>

        {/* desktop: one comparison table */}
        <div className="mt-10 hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="w-1/4 p-6" />
                {PLAN_ORDER.map((id) => (
                  <th key={id} className={`p-6 align-bottom ${id === "standard" ? "bg-leaf-soft/60" : ""}`}>
                    <span className="block font-display text-2xl font-bold">{PLANS[id].name}</span>
                    <span className="mt-1 block text-slate">
                      <span className="font-display text-3xl font-bold text-ink">{PLANS[id].price}</span>
                      {PLANS[id].monthly > 0 && " / month"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-b border-line last:border-0">
                  <th scope="row" className="p-6 font-semibold text-slate">
                    {row.label}
                  </th>
                  {PLAN_ORDER.map((id) => (
                    <td key={id} className={`p-6 ${id === "standard" ? "bg-leaf-soft/60" : ""}`}>
                      {PLANS[id][row.key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {PLAN_ORDER.map((id) => (
                  <td key={id} className={`p-6 pt-2 ${id === "standard" ? "bg-leaf-soft/60" : ""}`}>
                    <Link href={id === "free" ? "/download" : `/account?plan=${id}`} className={id === "free" ? "btn-quiet" : "btn-primary"}>
                      {id === "free" ? "Download free" : `Get ${PLANS[id].name}`}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* mobile: one block per plan */}
        <div className="mt-8 space-y-4 md:hidden">
          {PLAN_ORDER.map((id) => (
            <div key={id} className={`rounded-2xl border border-line p-5 ${id === "standard" ? "bg-leaf-soft/60" : "bg-white"}`}>
              <p className="font-display text-2xl font-bold">
                {PLANS[id].name}{" "}
                <span className="text-lg font-semibold text-slate">
                  {PLANS[id].price}
                  {PLANS[id].monthly > 0 && " / month"}
                </span>
              </p>
              <dl className="mt-3 space-y-2">
                {ROWS.map((row) => (
                  <div key={row.key}>
                    <dt className="text-sm text-slate">{row.label}</dt>
                    <dd>{PLANS[id][row.key]}</dd>
                  </div>
                ))}
              </dl>
              <Link href={id === "free" ? "/download" : `/account?plan=${id}`} className={`mt-4 ${id === "free" ? "btn-quiet" : "btn-primary"}`}>
                {id === "free" ? "Download free" : `Get ${PLANS[id].name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
