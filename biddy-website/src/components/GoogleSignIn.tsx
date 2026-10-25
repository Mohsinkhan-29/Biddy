"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/config";

interface GoogleId {
  initialize(o: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, o: Record<string, string | number>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Google's own "Continue with Google" button (Google Identity Services). */
export function GoogleSignIn({ onCredential }: { onCredential: (credential: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    if (window.google) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !box.current || !window.google || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (r) => callback.current(r.credential),
    });
    window.google.accounts.id.renderButton(box.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 280,
    });
  }, [ready]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className="text-flag">Sign-in isn’t configured: set NEXT_PUBLIC_GOOGLE_CLIENT_ID.</p>;
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div ref={box} className="min-h-[44px]" />
    </>
  );
}
