import { registerMessageRouter } from "./messageRouter";

registerMessageRouter();

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Biddy] service worker installed");
});
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "DEBUG_SELECTORS_RESULT") {
    return;
  }

  console.group(
    "%c[Biddy] Selector Debug",
    "color:#00ff88;font-weight:bold;font-size:14px"
  );

  console.log("From tab:", sender.tab?.id);
  console.log("URL:", sender.tab?.url);

  console.table(
    message.results.map((result: any) => ({
      Selector: result.name,
      CSS: result.selector,
      Matches: result.count,
      Samples: result.samples
        .map((sample: any) => sample.text)
        .join(" | "),
    }))
  );

  for (const result of message.results) {
    console.group(
      `${result.count > 0 ? "✅" : "❌"} ${result.name}`
    );

    console.log("CSS selector:", result.selector);
    console.log("Match count:", result.count);

    result.samples.forEach((sample: any, index: number) => {
      console.group(`Sample ${index + 1}`);

      console.log("Text:", sample.text);
      console.log("HTML:", sample.html);

      console.groupEnd();
    });

    console.groupEnd();
  }

  console.groupEnd();
});