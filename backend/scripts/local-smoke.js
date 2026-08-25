process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";
const assert = require("node:assert/strict");
const http = require("node:http");
const createApp = require("../app");

const server = http.createServer(createApp());
server.listen(0, "127.0.0.1", async () => {
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).success, true);
    const auth = await fetch(`${base}/api/auth/me`);
    assert.equal(auth.status, 401);
    const missing = await fetch(`${base}/api/not-a-route`);
    assert.equal(missing.status, 404);
    console.log("Local backend smoke passed (health, auth guard, 404). ");
  } finally { server.close(); }
}).on("error", error => { console.error(error); process.exitCode = 1; });
