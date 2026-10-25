/**
 * Upwork is a client-rendered SPA — the node a selector targets frequently
 * doesn't exist yet at `document_idle`, it appears a beat later once React
 * hydrates. Fire-and-forget `querySelector` calls race that render and lose.
 *
 * This polls via MutationObserver instead of a fixed setTimeout so it
 * resolves the instant the node shows up, and gives up cleanly after
 * `timeoutMs` so a genuinely-changed selector fails loud (console warning)
 * rather than hanging forever.
 */
export function waitForElement(
  selector: string,
  options: { root?: ParentNode; timeoutMs?: number } = {},
): Promise<Element | null> {
  const { root = document, timeoutMs = 8000 } = options;

  const existing = root.querySelector(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        cleanup();
        resolve(el);
      }
    });

    const timer = setTimeout(() => {
      cleanup();
      console.warn(
        `[Biddy] waitForElement timed out after ${timeoutMs}ms for selector: "${selector}" — ` +
          `Upwork's markup may have changed. Check domSelectors.ts against the live DOM.`,
      );
      resolve(null);
    }, timeoutMs);

    function cleanup() {
      observer.disconnect();
      clearTimeout(timer);
    }

    observer.observe(document.body, { childList: true, subtree: true });
  });
}
