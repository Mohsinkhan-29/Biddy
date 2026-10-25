"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useSession } from "@/lib/useSession";
import { api, type SiteUser } from "@/lib/api";
import { CONTACT_EMAIL, PAYMENT_METHODS, PLANS, type PlanId } from "@/lib/config";

interface Usage {
  proposalsGenerated: number;
  analysesGenerated: number;
}
interface UpgradeRequest {
  id: string;
  plan: PlanId;
  paymentRef: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <Account />
    </Suspense>
  );
}

function Account() {
  const { state, error, signIn, signOut, reload } = useSession();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6">
      {state.status === "loading" && <p className="text-slate">Loading your account…</p>}

      {state.status === "signedOut" && (
        <section>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Your Biddy account</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate">
            Sign in with the same Google account you use in the extension to see your plan and upgrade.
          </p>
          <div className="mt-8">
            <GoogleSignIn onCredential={signIn} />
          </div>
          {error && <p className="mt-4 text-flag">{error}</p>}
        </section>
      )}

      {state.status === "signedIn" && <SignedIn user={state.user} onSignOut={signOut} onChanged={reload} />}
    </main>
  );
}

function SignedIn({ user, onSignOut, onChanged }: { user: SiteUser; onSignOut: () => void; onChanged: () => void }) {
  const params = useSearchParams();
  const wanted = params.get("plan");

  const [usage, setUsage] = useState<Usage | null>(null);
  const [request, setRequest] = useState<UpgradeRequest | null>(null);

  const load = useCallback(() => {
    api<Usage>("/api/user/usage").then(setUsage).catch(() => undefined);
    api<UpgradeRequest | null>("/api/billing/request").then(setRequest).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  const plan = PLANS[user.plan];
  const limit = user.plan === "standard" ? 100 : user.plan === "premium" ? Infinity : 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {user.picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.picture} alt="" className="h-12 w-12 rounded-full" referrerPolicy="no-referrer" />
          )}
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
            <p className="text-slate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.isAdmin && (
            <Link href="/admin" className="btn-quiet">
              Admin
            </Link>
          )}
          <button onClick={onSignOut} className="btn-quiet">
            Sign out
          </button>
        </div>
      </div>

      {/* CURRENT PLAN */}
      <section className="mt-10 rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-slate">Current plan</h2>
        <p className="mt-1 font-display text-4xl font-bold">
          {plan.name}
          {plan.monthly > 0 && <span className="ml-2 text-xl font-semibold text-slate">{plan.price} / month</span>}
        </p>
        {user.planExpiresAt && (
          <p className="mt-2 text-slate">Active until {dateFmt.format(new Date(user.planExpiresAt))}</p>
        )}
        {usage && limit > 0 && (
          <p className="mt-4">
            Proposals this month:{" "}
            <b>
              {usage.proposalsGenerated}
              {Number.isFinite(limit) ? ` of ${limit}` : ""}
            </b>
          </p>
        )}
        <p className="mt-4 text-sm text-slate">
          Plan changes reach the extension the next time you open it.
        </p>
      </section>

      <RequestStatus request={request} />

      {user.plan !== "premium" && request?.status !== "pending" && (
        <UpgradeForm
          current={user.plan}
          initial={wanted === "premium" || wanted === "standard" ? wanted : user.plan === "standard" ? "premium" : "standard"}
          onSent={(r) => {
            setRequest(r);
            onChanged();
          }}
        />
      )}

      {user.plan !== "free" && request?.status !== "pending" && (
        <p className="mt-6 text-slate">
          To renew, send this month’s payment and submit the form again with the new reference — your days carry over.
        </p>
      )}
    </>
  );
}

function RequestStatus({ request }: { request: UpgradeRequest | null }) {
  if (!request) return null;
  const name = PLANS[request.plan].name;

  if (request.status === "pending")
    return (
      <section className="mt-6 rounded-2xl border border-amber/40 bg-amber-soft p-6">
        <h2 className="text-lg font-semibold">Checking your payment for {name}</h2>
        <p className="mt-1 leading-relaxed">
          Reference <b>{request.paymentRef}</b>, sent {dateFmt.format(new Date(request.createdAt))}. Your plan switches
          on as soon as the payment is confirmed, usually within a day.
        </p>
      </section>
    );

  if (request.status === "rejected")
    return (
      <section className="mt-6 rounded-2xl border border-flag/30 bg-flag-soft p-6">
        <h2 className="text-lg font-semibold">We couldn’t match your payment for {name}</h2>
        <p className="mt-1 leading-relaxed">
          Reference <b>{request.paymentRef}</b> didn’t match a payment we received. Check the reference and send the
          form again{CONTACT_EMAIL ? <>, or email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : ""}.
        </p>
      </section>
    );

  return null;
}

function UpgradeForm({
  current,
  initial,
  onSent,
}: {
  current: PlanId;
  initial: "standard" | "premium";
  onSent: (r: UpgradeRequest) => void;
}) {
  const choices = (["standard", "premium"] as const).filter((p) => !(current === "standard" && p === "standard"));
  const [plan, setPlan] = useState<"standard" | "premium">(choices.includes(initial) ? initial : choices[0]);
  const [ref, setRef] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      onSent(await api<UpgradeRequest>("/api/billing/request", { method: "POST", body: { plan, paymentRef: ref } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold sm:text-3xl">{current === "free" ? "Upgrade" : "Move to Premium"}</h2>

      <form onSubmit={send} className="mt-6 space-y-8">
        <fieldset>
          <legend className="font-semibold">1. Choose a plan</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {choices.map((id) => (
              <label
                key={id}
                className={`cursor-pointer rounded-xl border-2 bg-white p-4 ${plan === id ? "border-leaf" : "border-line"}`}
              >
                <input type="radio" name="plan" value={id} checked={plan === id} onChange={() => setPlan(id)} className="sr-only" />
                <span className="block font-display text-xl font-bold">
                  {PLANS[id].name} <span className="text-base font-semibold text-slate">{PLANS[id].price} / month</span>
                </span>
                <span className="mt-1 block text-slate">
                  {PLANS[id].proposals} proposals · {PLANS[id].model}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="font-semibold">
            2. Send {PLANS[plan].price} using one of these
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.name} className="rounded-xl border border-line bg-white p-4">
                <p className="font-semibold">{m.name}</p>
                {m.details.map((d) => (
                  <p key={d} className="text-slate">
                    {d}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="ref" className="font-semibold">
            3. Enter your payment reference
          </label>
          <p className="mt-1 text-slate">The transaction ID or reference number from your receipt.</p>
          <input
            id="ref"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            required
            minLength={3}
            maxLength={200}
            placeholder="e.g. TXN 4823 9910"
            className="field mt-3 max-w-md"
          />
        </div>

        {error && <p className="text-flag">{error}</p>}

        <button type="submit" disabled={sending || ref.trim().length < 3} className="btn-primary px-6 py-3">
          {sending ? "Sending…" : "Send upgrade request"}
        </button>
      </form>
    </section>
  );
}
