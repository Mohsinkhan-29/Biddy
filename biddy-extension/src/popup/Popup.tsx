import { App } from "@sidebar/App";

// The popup IS the panel now — Chrome renders whatever default_popup points
// to as a native dropdown automatically. No "open in a new tab" step needed;
// that was unnecessary indirection in the first pass.
export function Popup() {
  return <App />;
}
