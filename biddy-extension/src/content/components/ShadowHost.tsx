import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import tailwindCss from "@styles/tailwind.css?inline";

interface ShadowHostProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mounts children inside a ShadowRoot with the compiled Tailwind sheet
 * injected directly into it, so Biddy's styles never leak onto Upwork's
 * page and Upwork's styles never leak into Biddy's UI.
 */
export function ShadowHost({ children, className }: ShadowHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowBody, setShadowBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!hostRef.current || hostRef.current.shadowRoot) return;
    const root = hostRef.current.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = tailwindCss;
    root.appendChild(style);

    const body = document.createElement("div");
    body.className = "font-sans";
    root.appendChild(body);

    setShadowBody(body);
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {shadowBody && createPortal(children, shadowBody)}
    </div>
  );
}
