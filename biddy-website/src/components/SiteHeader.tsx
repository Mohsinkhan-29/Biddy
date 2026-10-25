import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
        <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-leaf text-white">
          b
        </span>
        Biddy
      </Link>
      <nav className="flex items-center gap-1 text-[15px] sm:gap-3">
        <Link href="/#plans" className="hidden rounded-md px-3 py-2 text-slate hover:text-ink sm:block">
          Plans
        </Link>
        <Link href="/download" className="rounded-md px-3 py-2 text-slate hover:text-ink">
          Download
        </Link>
        <Link href="/account" className="btn-quiet px-4 py-2">
          Account
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate sm:flex-row sm:justify-between sm:px-6">
        <p>Biddy helps Upwork freelancers choose which jobs to bid on.</p>
        <p>Not affiliated with Upwork.</p>
      </div>
    </footer>
  );
}
