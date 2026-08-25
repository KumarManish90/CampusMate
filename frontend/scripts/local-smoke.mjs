import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist"), html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
assert.match(html, /<div id="root"><\/div>/, "Vite root missing");
const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(m => m[1]);
assert.ok(assets.length >= 2, "built JS/CSS assets missing");
for (const asset of assets) assert.ok(fs.statSync(path.join(dist, asset.replace(/^\//, ""))).size > 0, `${asset} is missing or empty`);
const js = fs.readFileSync(path.join(dist, assets.find(x => x.endsWith(".js")).replace(/^\//, "")), "utf8");
assert.match(js, /chat:message/, "native chat contract missing from bundle");
assert.doesNotMatch(js, /data-cm-profile-live|join_match|new_message/, "obsolete compatibility code found in bundle");
console.log(`Local frontend smoke passed (${assets.length} assets).`);
