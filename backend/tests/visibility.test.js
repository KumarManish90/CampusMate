const test = require("node:test");
const assert = require("node:assert/strict");

const { visibilityRules } = require("../utils/visibility");

test("anonymous viewers can only query public content", () => {
  assert.deepEqual(visibilityRules(null), { visibility: "public" });
});

test("signed-in visibility includes own, campus, college and connected content", () => {
  const filter = visibilityRules(
    { _id: "viewer-id", collegeName: "GGITS" },
    ["connection-id", "match-id"]
  );

  assert.deepEqual(filter, {
    $or: [
      { author: "viewer-id" },
      { visibility: "public" },
      { visibility: "campus" },
      { visibility: "college", college: "GGITS" },
      { visibility: "connections", author: { $in: ["connection-id", "match-id"] } },
    ],
  });
});

test("connection-only content is omitted when the viewer has no peers", () => {
  const filter = visibilityRules({ _id: "viewer-id", collegeName: "GGCT" });
  assert.equal(filter.$or.some((rule) => rule.visibility === "connections"), false);
});
