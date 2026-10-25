import Link from "next/link";
import { EXTENSION_ZIP } from "@/lib/config";

export const metadata = { title: "Download Biddy for Chrome" };

const STEPS: [string, React.ReactNode][] = [
  ["Download and unzip", "Save the zip below and extract it to a folder you’ll keep — Chrome loads Biddy from there."],
  ["Open Chrome’s extensions page", <>Type <code className="rounded bg-line/60 px-1.5 py-0.5">chrome://extensions</code> in the address bar.</>],
  ["Turn on Developer mode", "Use the switch in the top-right corner of that page."],
  ["Load the folder", "Click Load unpacked and choose the folder you extracted."],
  ["Pin Biddy and sign in", "Click the puzzle icon in Chrome’s toolbar, pin Biddy, open it and continue with Google."],
];

export default function DownloadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Download Biddy for Chrome</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate">
        Biddy isn’t in the Chrome Web Store yet, so it installs in five short steps. Works in Chrome, Edge and Brave.
      </p>

      <a href={EXTENSION_ZIP} download className="btn-primary mt-8 px-6 py-3 text-lg">
        Download biddy-extension.zip
      </a>

      <ol className="mt-12 space-y-7">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-5">
            <span className="font-display text-3xl font-extrabold leading-none text-leaf">{i + 1}</span>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-1 leading-relaxed text-slate">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-12 rounded-xl border border-line bg-white p-5 leading-relaxed text-slate">
        Updating? Download the new zip, replace the files in the same folder, then press the reload icon on Biddy’s
        card in <code className="rounded bg-line/60 px-1.5 py-0.5">chrome://extensions</code>. Your sign-in stays.{" "}
        <Link href="/account" className="font-semibold text-leaf-dark underline underline-offset-4">
          Manage your plan
        </Link>
      </p>
    </main>
  );
}
