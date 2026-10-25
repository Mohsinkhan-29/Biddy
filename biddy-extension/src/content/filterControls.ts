import { SELECTORS } from "./domSelectors";
import { setFilters, getFilters, type BiddyFilters } from "./analysisRegistry";

const STYLE_ID = "biddy-filter-styles";
const BUTTON_ID = "biddy-filter-action-btn";
const PANEL_ID = "biddy-filter-panel";

// Kept as a plain <style> + !important, not Tailwind: this UI is injected
// directly into Upwork's own DOM (not our Shadow DOM), so it needs to
// defensively out-rank Upwork's own stylesheet rather than being isolated
// from it. Colors match the biddy-* palette used inside the Shadow DOM UI.
const FILTER_CSS = `
  .biddy-btn-filter {
    background: #181B22 !important;
    color: #5EEAD4 !important;
    border: 1px solid #5EEAD4 !important;
    border-radius: 20px !important;
    padding: 6px 14px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    margin-left: 10px !important;
  }
  .biddy-btn-filter:hover { background: #1e222b !important; }

  .biddy-filter-panel {
    background: #181B22 !important;
    border: 1px solid #262B36 !important;
    border-radius: 10px !important;
    padding: 14px !important;
    margin: 10px 0 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }
  .biddy-filter-title {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #E6E9EF !important;
    text-transform: uppercase !important;
    letter-spacing: 0.4px !important;
    display: block !important;
    margin-bottom: 10px !important;
  }
  .biddy-filter-row {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    font-size: 13px !important;
    color: #E6E9EF !important;
    margin-bottom: 8px !important;
  }
  .biddy-filter-row select {
    padding: 3px 6px !important;
    border-radius: 6px !important;
    border: 1px solid #262B36 !important;
    background: #0F1115 !important;
    color: #E6E9EF !important;
  }
`;

function ensureStylesInjected(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = FILTER_CSS;
  document.head.appendChild(style);
}

export function injectFilterControls(): void {
  if (document.getElementById(BUTTON_ID)) return; // already injected

  const nativeToggle = document.querySelector(SELECTORS.feed.filterToggle);
  if (!nativeToggle?.parentNode) return;

  ensureStylesInjected();

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.className = "biddy-btn-filter";
  button.textContent = "⚙ Biddy Filters";
  nativeToggle.parentNode.insertBefore(button, nativeToggle.nextSibling);

  const panel = buildPanel();
  button.parentNode?.parentNode?.insertBefore(panel, button.parentNode.nextSibling);

  button.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });
}

function buildPanel(): HTMLDivElement {
  const filters = getFilters();

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "biddy-filter-panel";
  panel.style.display = "none";
  panel.innerHTML = `
    <span class="biddy-filter-title">Biddy Real-Time Feed Filters</span>
    <label class="biddy-filter-row">
      <input type="checkbox" id="biddy-chk-creep" ${filters.hideHighRiskCreep ? "checked" : ""} />
      Hide High Scope Creep Risk jobs
    </label>
    <label class="biddy-filter-row">
      Minimum Review Sentiment:
      <select id="biddy-sel-sentiment">
        <option value="all" ${filters.minSentiment === "all" ? "selected" : ""}>Show all</option>
        <option value="positive" ${filters.minSentiment === "positive" ? "selected" : ""}>Consistently Positive only</option>
      </select>
    </label>
  `;

  panel.querySelector("#biddy-chk-creep")?.addEventListener("change", (e) => {
    const next: BiddyFilters = {
      ...getFilters(),
      hideHighRiskCreep: (e.target as HTMLInputElement).checked,
    };
    setFilters(next);
  });

  panel.querySelector("#biddy-sel-sentiment")?.addEventListener("change", (e) => {
    const next: BiddyFilters = {
      ...getFilters(),
      minSentiment: (e.target as HTMLSelectElement).value as BiddyFilters["minSentiment"],
    };
    setFilters(next);
  });

  return panel;
}
