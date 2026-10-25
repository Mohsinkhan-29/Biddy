/**
 * A job from the Upwork feed with Biddy's sheet attached underneath — the
 * same layout the extension injects. The numbers are what Biddy's engine
 * produced for this posting.
 */
export function SheetPreview() {
  return (
    <figure className="relative">
      {/* the Upwork job tile */}
      <div className="rounded-t-2xl border border-line bg-white p-5 sm:p-6">
        <p className="text-sm text-slate">Posted 2 hours ago · Proposals: 10 to 15</p>
        <h3 className="mt-2 font-body text-xl font-semibold leading-snug text-ink sm:text-[22px]">
          We’re Hiring: Full-Stack Developer + UI/UX App Designer
        </h3>
        <p className="mt-1 text-sm text-slate">Hourly: $5–$10 · Entry level · More than 6 months</p>
        <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-ink/80">
          We’re looking for a talented Full-Stack Developer to help us build an online 1-to-1 language learning
          platform, including web and mobile app, admin panel, payments, scheduling and more. Contact me on WhatsApp.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
          <span>Payment verified</span>
          <span>$0 spent</span>
          <span>Egypt</span>
        </p>
      </div>

      {/* Biddy's sheet */}
      <div className="sheet-in relative overflow-hidden rounded-b-2xl border border-t-0 border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgba(20,33,61,0.35)] sm:p-6">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-leaf" aria-hidden />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-leaf-dark">Biddy Intelligence Sheet</span>
          <span className="rounded-full bg-flag-soft px-2.5 py-1 text-sm font-semibold text-flag">
            Bid Score 28 · Likely skip
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate">Scope creep</dt>
            <dd className="font-semibold">
              90% <span className="text-flag">High risk</span>
            </dd>
          </div>
          <div>
            <dt className="text-slate">Client persona</dt>
            <dd className="font-semibold">First-Time Hirer / Long-Term Builder</dd>
          </div>
          <div>
            <dt className="text-slate">Suggested bid</dt>
            <dd className="font-semibold">$9/hr — upper-middle of their range</dd>
          </div>
        </dl>

        <ul className="mt-4 grid gap-1.5 text-[15px] sm:grid-cols-2 sm:gap-x-6">
          <li className="flex gap-2">
            <span className="text-flag" aria-label="Warning">⚠</span>Asks to move to WhatsApp — keep it on Upwork
          </li>
          <li className="flex gap-2">
            <span className="text-flag" aria-label="Warning">⚠</span>$5–$10/hr for a platform-sized build
          </li>
          <li className="flex gap-2">
            <span className="text-leaf" aria-label="Good sign">✓</span>Verified payment, first project
          </li>
          <li className="flex gap-2">
            <span className="text-leaf" aria-label="Good sign">✓</span>Posted within the last few hours
          </li>
        </ul>

        <p className="mt-4 rounded-lg border border-dashed border-leaf/40 bg-leaf-soft/60 px-3 py-2.5 text-[15px] leading-snug">
          <span className="font-semibold text-leaf-dark">Proposal move: </span>
          Budget is tight for this scope — quote a lean phase one (core platform only) instead of underbidding the
          whole build.
        </p>
      </div>
      <figcaption className="sr-only">Example of the Biddy sheet under an Upwork job post</figcaption>
    </figure>
  );
}
