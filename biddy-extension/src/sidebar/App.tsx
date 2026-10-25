import { useState } from "react";
import { DashboardTab } from "./tabs/DashboardTab";
import { ProposalEngineTab } from "./tabs/ProposalEngineTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserMenu } from "./components/UserMenu";

type Tab = "dashboard" | "proposal" | "config";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "proposal", label: "Proposal Engine" },
  { id: "config", label: "Config" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="w-[360px] min-h-[480px] flex flex-col">
      {/* ProtectedRoute wraps the whole panel: while logged out, this renders
          LoginScreen full-panel and nothing else — no tab, no header menu,
          no path to an AI call — exactly the "extension MUST NOT function
          before login" requirement. */}
      <ProtectedRoute>
        {(user, refreshAuth) => (
          <>
            <header className="px-4 py-3 border-b border-biddy-border flex items-center justify-between">
              <h1 className="text-sm font-semibold text-biddy-accent">Biddy</h1>
              <UserMenu user={user} onLoggedOut={refreshAuth} />
            </header>

            <nav className="flex border-b border-biddy-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t.id
                      ? "text-biddy-accent border-b-2 border-biddy-accent"
                      : "text-biddy-muted hover:text-biddy-text"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <main className="flex-1 p-4">
              {tab === "dashboard" && <DashboardTab />}
              {tab === "proposal" && <ProposalEngineTab plan={user.plan} />}
              {tab === "config" && <ConfigTab />}
            </main>
          </>
        )}
      </ProtectedRoute>
    </div>
  );
}