import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LoginScreen } from "./LoginScreen";
import type { AuthCheckResult, BiddyMessage, BiddyResponse, StoredUser } from "@shared/types";

type Status = "checking" | "loggedOut" | "loggedIn";

/**
 * Gates the extension behind a login check on every mount (popup open).
 * Nothing under `children` renders — and no backend call can be made from
 * it — until the background worker confirms a stored session.
 */
export function ProtectedRoute({
  children,
}: {
  children: (user: StoredUser, refreshAuth: () => void) => ReactNode;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<StoredUser | null>(null);

  const refresh = useCallback(async () => {
    setStatus("checking");
    const message: BiddyMessage = { type: "CHECK_AUTH" };
    const response: BiddyResponse<AuthCheckResult> = await chrome.runtime.sendMessage(message);

    if (response.ok && response.data.loggedIn && response.data.user) {
      setUser(response.data.user);
      setStatus("loggedIn");
    } else {
      setUser(null);
      setStatus("loggedOut");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-[420px] text-xs text-biddy-muted">
        Checking session…
      </div>
    );
  }

  if (status === "loggedOut" || !user) {
    return <LoginScreen onLoggedIn={refresh} />;
  }

  return <>{children(user, refresh)}</>;
}
