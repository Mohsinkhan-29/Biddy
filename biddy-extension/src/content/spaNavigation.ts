/**
 * Upwork navigates between job pages with pushState/replaceState, not full
 * page loads. A `matches`-based content script only ever injects once per
 * real navigation, so without this, Biddy's UI silently freezes on whatever
 * job the user first landed on and never re-scrapes when they click to the
 * next one.
 *
 * We patch history.pushState/replaceState (the only reliable cross-site way
 * to observe SPA route changes — there's no native event for it) and also
 * listen for popstate/back-forward. `onUrlChange` fires once per distinct
 * URL, debounced onto a microtask so multiple synchronous history calls in
 * the same tick only trigger one callback.
 */
export function watchUrlChanges(onUrlChange: (url: string) => void): () => void {
  let lastUrl = window.location.href;

  const notify = () => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    onUrlChange(lastUrl);
  };

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args) => {
    originalPushState(...args);
    queueMicrotask(notify);
  };
  history.replaceState = (...args) => {
    originalReplaceState(...args);
    queueMicrotask(notify);
  };

  window.addEventListener("popstate", notify);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", notify);
  };
}
