const assert = require("assert");

const base = (process.env.SMOKE_BASE_URL || "https://campusmate-87k6.onrender.com").replace(/\/$/, "");

async function check(path, expected) {
  const response = await fetch(`${base}${path}`);
  assert(expected.includes(response.status), `${path}: expected ${expected.join("/")}, got ${response.status}`);
  return response;
}

(async () => {
  await check("/", [404]);
  await check("/api/colleges", [200]);
  await check("/api/auth/me", [401]);
  console.log(`Smoke checks passed for ${base}`);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
