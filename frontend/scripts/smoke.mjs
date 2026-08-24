import assert from "node:assert/strict";

const base = (process.env.SMOKE_FRONTEND_URL || "https://campusmate-git-gemini-updates-bodom-squads.vercel.app").replace(/\/$/, "");
const response = await fetch(base, { redirect: "follow" });
assert.equal(response.status, 200, `frontend expected 200, got ${response.status}`);
const html = await response.text();
assert.match(html, /<div id="root"><\/div>/, "Vite root element missing");
assert.match(html, /assets\/index-.*\.js/, "built JavaScript asset missing");
console.log(`Frontend smoke checks passed for ${base}`);
