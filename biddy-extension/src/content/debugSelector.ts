import { SELECTORS } from "./domSelectors";

type SelectorDebugSample = {
  text: string;
  html: string;
};

type SelectorDebugResult = {
  name: string;
  selector: string;
  count: number;
  samples: SelectorDebugSample[];
};

function debugSelectorGroup<T extends Record<string, string>>(
  groupName: string,
  selectors: T
): SelectorDebugResult[] {
  return Object.entries(selectors).map(([name, selector]) => {
    const elements = document.querySelectorAll(selector);

    const samples: SelectorDebugSample[] = Array.from(elements)
      .slice(0, 3)
      .map((el) => ({
        text: el.textContent?.trim() || "",
        html: el.outerHTML.slice(0, 1000),
      }));

    return {
      name: `${groupName}.${name}`,
      selector,
      count: elements.length,
      samples,
    };
  });
}

export function debugSelectors() {
  const results: SelectorDebugResult[] = [
    ...debugSelectorGroup("feed", SELECTORS.feed),
    ...debugSelectorGroup("jobCard", SELECTORS.jobCard),
    ...debugSelectorGroup(
      "jobDetailPage",
      SELECTORS.jobDetailPage
    ),
  ];

  console.group(
    "%c[DEBUG] Upwork Selectors",
    "color:#00e5ff;font-weight:bold;font-size:14px"
  );

  console.table(
    results.map((result) => ({
      Selector: result.name,
      Matches: result.count,
      Samples: result.samples
        .map((sample) => sample.text)
        .join(" | "),
    }))
  );

  results.forEach((result) => {
    console.group(
      `${result.count > 0 ? "✅" : "❌"} ${result.name}`
    );

    console.log("CSS:", result.selector);
    console.log("Matches:", result.count);

    result.samples.forEach((sample, index) => {
      console.group(`Sample ${index + 1}`);

      console.log("Text:", sample.text);
      console.log("HTML:", sample.html);

      console.groupEnd();
    });

    console.groupEnd();
  });

  console.groupEnd();

  // Send results to service worker
  chrome.runtime.sendMessage({
    type: "DEBUG_SELECTORS_RESULT",
    results,
  });

  return results;
}