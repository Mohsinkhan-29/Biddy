"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { useSession } from "@/lib/useSession";
import { api, type SiteUser } from "@/lib/api";
import { PLANS, type PlanId } from "@/lib/config";

interface PendingRequest {
  id: string;
  plan: PlanId;
  paymentRef: string;
  createdAt: string;
  user: { email: string; name: string; plan: PlanId; planExpiresAt: string | null };
}
interface AdminUser extends SiteUser {
  createdAt: string;
  usage: { proposalsGenerated: number; analysesGenerated: number };
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const fmt = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");

export default function AdminPage() {
  const { state, error, signIn } = useSession();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      {state.status === "loading" && <p className="text-slate">Loading…</p>}

      {state.status === "signedOut" && (
        <>
          <h1 className="text-4xl font-extrabold">Admin</h1>
          <p className="mt-3 text-slate">Sign in with your admin Google account.</p>
          <div className="mt-6">
            <GoogleSignIn onCredential={signIn} />
          </div>
          {error && <p className="mt-4 text-flag">{error}</p>}
        </>
      )}

      {state.status === "signedIn" && !state.user.isAdmin && (
        <>
          <h1 className="text-4xl font-extrabold">Admin</h1>
          <p className="mt-3 text-slate">
            {state.user.email} isn’t an admin account. Add it to ADMIN_EMAILS on the backend, or{" "}
            <Link href="/account" className="font-semibold text-leaf-dark underline underline-offset-4">
              go to your account
            </Link>
            .
          </p>
        </>
      )}

      {state.status === "signedIn" && state.user.isAdmin && <Dashboard />}
    </main>
  );
}

function Dashboard() {
  const [requests, setRequests] = useState<PendingRequest[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, u] = await Promise.all([
        api<PendingRequest[]>("/api/admin/requests?status=pending"),
        api<AdminUser[]>("/api/admin/users"),
      ]);
      setRequests(r);
      setUsers(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = users
    ? (["free", "standard", "premium"] as const).map((p) => [PLANS[p].name, users.filter((u) => u.plan === p).length] as const)
    : [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold">Admin</h1>
        {users && (
          <p className="text-slate">
            {users.length} users — {counts.map(([n, c]) => `${c} ${n}`).join(", ")}
          </p>
        )}
      </div>
      {error && <p className="mt-4 text-flag">{error}</p>}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Upgrade requests</h2>
        {requests === null ? (
          <p className="mt-3 text-slate">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="mt-3 text-slate">No requests waiting. New ones from the account page show up here.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-line text-sm text-slate">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Wants</th>
                  <th className="p-4 font-semibold">Payment reference</th>
                  <th className="p-4 font-semibold">Sent</th>
                  <th className="p-4 font-semibold">Decision</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <RequestRow key={r.id} request={r} onDone={load} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold">Users</h2>
        {users === null ? (
          <p className="mt-3 text-slate">Loading…</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-line text-sm text-slate">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold">This month</th>
                  <th className="p-4 font-semibold">Plan and expiry</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} user={u} onSaved={load} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function RequestRow({ request, onDone }: { request: PendingRequest; onDone: () => void }) {
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (action: "approve" | "reject") => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/requests/${request.id}/${action}`, {
        method: "POST",
        body: action === "approve" ? { months } : {},
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="p-4">
        <p className="font-semibold">{request.user.name}</p>
        <p className="text-sm text-slate">
          {request.user.email} · now {PLANS[request.user.plan].name}
        </p>
      </td>
      <td className="p-4 font-semibold">
        {PLANS[request.plan].name} <span className="font-normal text-slate">{PLANS[request.plan].price}/mo</span>
      </td>
      <td className="p-4 font-mono text-sm">{request.paymentRef}</td>
      <td className="p-4 text-slate">{fmt(request.createdAt)}</td>
      <td className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`m-${request.id}`}>
            Months paid
          </label>
          <select
            id={`m-${request.id}`}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="field w-auto py-1.5"
          >
            {[1, 2, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? "month" : "months"}
              </option>
            ))}
          </select>
          <button onClick={() => decide("approve")} disabled={busy} className="btn-primary px-3 py-1.5">
            Approve
          </button>
          <button onClick={() => decide("reject")} disabled={busy} className="btn-quiet px-3 py-1.5">
            Reject
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-flag">{error}</p>}
      </td>
    </tr>
  );
}

function UserRow({ user, onSaved }: { user: AdminUser; onSaved: () => void }) {
  const [plan, setPlan] = useState<PlanId>(user.plan);
  const [expires, setExpires] = useState(user.planExpiresAt ? user.planExpiresAt.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = plan !== user.plan || expires !== (user.planExpiresAt?.slice(0, 10) ?? "");

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: { plan, planExpiresAt: plan !== "free" && expires ? new Date(`${expires}T23:59:59Z`).toISOString() : null },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="p-4">
        <p className="font-semibold">
          {user.name}
          {user.isAdmin && <span className="ml-2 rounded bg-leaf-soft px-1.5 py-0.5 text-xs text-leaf-dark">admin</span>}
        </p>
        <p className="text-sm text-slate">{user.email}</p>
      </td>
      <td className="p-4 text-slate">{fmt(user.createdAt)}</td>
      <td className="p-4 text-slate">
        {user.usage.proposalsGenerated} proposals, {user.usage.analysesGenerated} AI analyses
      </td>
      <td className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`p-${user.id}`}>
            Plan
          </label>
          <select id={`p-${user.id}`} value={plan} onChange={(e) => setPlan(e.target.value as PlanId)} className="field w-auto py-1.5">
            {(["free", "standard", "premium"] as const).map((p) => (
              <option key={p} value={p}>
                {PLANS[p].name}
              </option>
            ))}
          </select>
          {plan !== "free" && (
            <>
              <label className="sr-only" htmlFor={`e-${user.id}`}>
                Active until
              </label>
              <input
                id={`e-${user.id}`}
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className="field w-auto py-1.5"
              />
            </>
          )}
          <button onClick={save} disabled={!dirty || busy} className="btn-quiet px-3 py-1.5">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {plan !== "free" && !expires && <p className="mt-1 text-sm text-slate">No end date — stays on this plan.</p>}
        {error && <p className="mt-2 text-sm text-flag">{error}</p>}
      </td>
    </tr>
  );
}
