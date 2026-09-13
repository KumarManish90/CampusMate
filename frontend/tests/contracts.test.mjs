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
test("mobile layout resets the viewport and collapses explore grids", () => {
  assert.match(css, /html,body,#root\{[^}]*margin:0/);
  assert.match(css, /\.cm-explore-grid\{grid-template-columns:minmax\(0,1fr\)!important\}/);
  assert.match(app, /className="cm-explore-grid"/);
  assert.match(app, /className="cm-scroll-row cm-explore-tabs"/);
});
test("login skips signup onboarding while new accounts can complete it", () => {
  assert.match(app, /isNewAccount: mode === "register"/);
  assert.match(app, /setView\(isNewAccount \? "onboarding" : "app"\)/);
});
test("chat exposes presence, emoji and media controls", () => {
  assert.match(native, /presence:snapshot/);
  assert.match(native, /CHAT_EMOJIS/);
  assert.match(native, /image\/gif/);
  assert.match(native, /Paperclip/);
});
test("students can create communities and upcoming events", () => {
  assert.match(app, /Create campus community/);
  assert.match(app, /Add upcoming event/);
  assert.match(app, /cmApi\.createClub/);
  assert.match(app, /cmApi\.createEvent/);
});
test("section navigation resets scroll and action feedback stays in the viewport", () => {
  assert.match(app, /window\.scrollTo\(\{ top: 0/);
  assert.match(app, /cm-global-toast/);
  assert.match(css, /\.cm-global-toast\{position:fixed/);
  assert.doesNotMatch(app, /\{notice && <div className="cm-match-notice"/);
});
