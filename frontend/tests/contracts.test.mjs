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
  assert.match(app, /className="cm-app-shell"/);
  assert.match(css, /\.cm-sidebar\{display:none!important\}/);
  assert.match(css, /\.cm-bottomnav\{display:flex!important/);
  assert.match(css, /\.cm-app-content\{display:block;width:100%!important;max-width:100vw/);
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
  assert.match(native, /chat:typing/);
  assert.match(native, /chat:read/);
  assert.match(native, /cm-chat-search/);
  assert.match(native, /messageAttempt/);
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
test("signed-in landing opens the app and render failures recover to Home", () => {
  assert.match(app, /authUser \? "Open App" : "Get Started"/);
  assert.match(app, /authUser \? "Open CampusMate" : "Get Started"/);
  assert.match(app, /<FeatureErrorBoundary resetKey=\{tab\}/);
  assert.match(main, /Back to CampusMate Home/);
  assert.doesNotMatch(main, />Try again</);
});
test("native API collections use safe array defaults", () => {
  assert.match(native, /Array\.isArray\(data\) \? data : \[\]/);
  assert.match(native, /Array\.isArray\(userIds\) \? userIds : \[\]/);
});
test("mobile app exposes CampusMate beside greeting and keeps theme inside Profile", () => {
  assert.match(app, /className="cm-mobile-brand"/);
  assert.match(app, /aria-label="Open CampusMate cinematic page"/);
  assert.match(app, /tab === "profile" && <div className="cm-profile-theme"/);
  assert.match(app, /Switch to light mode/);
  assert.match(css, /\.cm-app-content button:active/);
  assert.match(css, /\.cm-mobile-toolbar\{display:none!important\}/);
  assert.match(css, /\.cm-mobile-brand\{[^}]*border:0[^}]*background:transparent/);
});
test("login resets to Home and mobile nav exposes Explore instead of Match", () => {
  assert.match(app, /onAuthed=\{\(user[\s\S]*?setTab\("home"\)/);
  assert.match(app, /\{ key: "explore", label: "Explore", icon: Compass \}/);
  assert.doesNotMatch(app, /\{ key: "discover", label: "Match", icon: Heart \}/);
});
test("profile is centered, responsive and isolates partial API failures", () => {
  assert.match(native, /Promise\.allSettled/);
  assert.match(native, /className="cm-profile-card"/);
  assert.match(css, /\.cm-profile-card\{width:min\(100%,780px\)/);
  assert.match(css, /\.cm-profile-summary\{flex-direction:column/);
  assert.match(native, /cm-profile-cover/);
  assert.match(native, /cm-profile-stats/);
  assert.match(native, /cm-profile-interests/);
  const profileSource = native.slice(native.indexOf("export function NativeProfile"), native.indexOf("function MediaGrid"));
  assert.doesNotMatch(profileSource, />Message</);
  assert.doesNotMatch(profileSource, />Connect</);
});

test("logged-in dashboard uses responsive interactive sections", () => {
  assert.match(app, /cm-home-dashboard/);
  assert.match(app, /cm-interactive-card/);
  assert.match(css, /\.cm-home-dashboard\{display:grid/);
  assert.match(css, /@media\(max-width:980px\)\{\.cm-home-dashboard\{grid-template-columns:1fr\}/);
});

test("reference-led campus UI preserves real data and collaboration language", () => {
  assert.match(app, /className="cm-home-search"/);
  assert.match(app, /imageUrl: cmApi\.resolveMediaUrl\(e\.image\?\.url\)/);
  assert.match(app, /className="cm-match-photo"/);
  assert.match(app, /label="Interested"/);
  assert.match(app, /label="Connect"/);
  assert.doesNotMatch(app, />SUPER ⭐</);
  assert.match(app, /cm-mixed-grid/);
});

test("messages expose responsive conversation filters without removing media chat", () => {
  assert.match(native, /conversationFilter/);
  assert.match(native, /\["all","unread","groups"\]/);
  assert.match(css, /\.cm-chat-filters/);
  assert.match(native, /accept="image\/jpeg,image\/png,image\/webp,image\/gif,video\/mp4,video\/webm"/);
});

test("mobile primary navigation stays fixed while secondary features remain reachable", () => {
  const nav = app.slice(app.indexOf("const NAV_ITEMS"), app.indexOf("const SIDEBAR_ITEMS"));
  for (const item of ["Home", "Explore", "Messages", "Profile"]) assert.match(nav, new RegExp(`label: "${item}"`));
  for (const secondary of ["Matching", "Events", "Clubs", "Announcements"]) assert.doesNotMatch(nav, new RegExp(`label: "${secondary}"`));
  assert.match(app, /className="cm-mobile-create" aria-label="Create"/);
  assert.match(css, /\.cm-bottomnav>\.cm-mobile-nav-item\{flex:1 1 0/);
});

test("Home links to existing matching and targeted Explore sections", () => {
  assert.match(app, /id="cm-home-match-title">Find Your People/);
  assert.match(app, /onClick=\{onGoDiscover\}>Start Matching/);
  assert.match(app, /onOpenExplore\("events"\)/);
  assert.match(app, /onOpenExplore\("clubs"\)/);
  assert.match(app, /initialTab=\{exploreTarget\.section\}/);
});
