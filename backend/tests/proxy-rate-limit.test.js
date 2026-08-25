const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

test("production limiter keys requests by the client behind one trusted proxy hop", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  };
  process.env.NODE_ENV = "production";
  process.env.CLIENT_URL = "https://campusmate.example";
  process.env.RATE_LIMIT_MAX = "1";

  // Load after setting the environment because app construction reads the
  // deployment mode and limiter settings.
  const createApp = require("../app");
  const app = createApp();
  assert.equal(app.get("trust proxy"), 1);

  const server = http.createServer(app);
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (forwardedFor) => fetch(`${base}/api/health`, { headers: { "x-forwarded-for": forwardedFor } });

  try {
    const first = await request("198.51.100.99, 203.0.113.10");
    assert.equal(first.status, 200);

    // Changing the untrusted, leftmost value must not evade the limit. With
    // one trusted hop, both requests resolve to the rightmost client address.
    const spoofAttempt = await request("192.0.2.77, 203.0.113.10");
    assert.equal(spoofAttempt.status, 429);

    // A distinct client forwarded by the same Render hop gets its own bucket.
    const otherClient = await request("198.51.100.20");
    assert.equal(otherClient.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
