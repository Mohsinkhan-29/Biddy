import { useState } from "react";
import type { BiddyMessage, BiddyResponse, StoredUser } from "@shared/types";

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const message: BiddyMessage = { type: "LOGIN_GOOGLE" };
      const response: BiddyResponse<StoredUser> = await chrome.runtime.sendMessage(message);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[420px] px-6 text-center">
      <span className="text-lg font-semibold text-biddy-accent">Biddy</span>
      <div>
        <h2 className="text-sm font-semibold text-biddy-text">Sign in to get started</h2>
        <p className="text-xs text-biddy-muted leading-snug mt-1">
          Job analyses and proposal drafts are saved to your account, so your history and usage
          carry across sessions and devices.
        </p>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full rounded-md bg-biddy-accent text-biddy-bg text-xs font-semibold py-2.5 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Continue with Google"}
      </button>

      {error && <p className="text-xs text-biddy-danger leading-snug">{error}</p>}
    </div>
  );
}
