import { useState } from "react";
import type { BiddyMessage, StoredUser } from "@shared/types";

export function UserMenu({ user, onLoggedOut }: { user: StoredUser; onLoggedOut: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const message: BiddyMessage = { type: "LOGOUT" };
      await chrome.runtime.sendMessage(message);
    } finally {
      setLoading(false);
      setOpen(false);
      onLoggedOut();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-biddy-text"
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-5 h-5 rounded-full bg-biddy-accent/20 flex items-center justify-center text-[10px] font-semibold text-biddy-accent">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="max-w-[80px] truncate">{user.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md border border-biddy-border bg-biddy-surface shadow-lg z-10 text-xs overflow-hidden">
          <div className="px-3 py-2 border-b border-biddy-border">
            <p className="text-biddy-text truncate">{user.email}</p>
            <p className="text-biddy-muted mt-0.5 capitalize">{user.plan} plan</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full text-left px-3 py-2 text-biddy-danger hover:bg-biddy-surfaceMuted disabled:opacity-50"
          >
            {loading ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
