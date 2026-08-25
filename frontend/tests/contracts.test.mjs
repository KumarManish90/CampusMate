import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const native = fs.readFileSync(new URL("../src/NativeFeatures.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/responsive.css", import.meta.url), "utf8");

test("compatibility overlays are not mounted", () => assert.doesNotMatch(main, /StabilizationLayers/));
test("stories, profile, messages and reels are native React children", () => {
  for (const component of ["NativeStories", "NativeProfile", "NativeMessages", "NativeReels"]) assert.match(app, new RegExp(`<${component}`));
});
test("Socket.IO client and server event contract is canonical", () => {
  assert.match(native, /chat:join/); assert.match(native, /chat:leave/); assert.match(native, /chat:message/);
  assert.doesNotMatch(native, /join_match|new_message/);
});
test("responsive CSS contains no inline-style attribute selector hacks", () => assert.doesNotMatch(css, /\[style\*=/));
