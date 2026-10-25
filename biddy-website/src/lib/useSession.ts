"use client";

import { useCallback, useEffect, useState } from "react";
import { api, hasSession, signInWithGoogle, signOut, type SiteUser } from "./api";

type State = { status: "loading" } | { status: "signedOut" } | { status: "signedIn"; user: SiteUser };

export function useSession() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!hasSession()) return setState({ status: "signedOut" });
    try {
      setState({ status: "signedIn", user: await api<SiteUser>("/api/user/me") });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState({ status: "signedOut" });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const signIn = useCallback(async (credential: string) => {
    setError(null);
    try {
      setState({ status: "signedIn", user: await signInWithGoogle(credential) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const leave = useCallback(async () => {
    await signOut();
    setState({ status: "signedOut" });
  }, []);

  return { state, error, signIn, signOut: leave, reload };
}
