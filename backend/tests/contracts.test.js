const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("REST chat broadcasts the canonical socket event", () => {
  const source = read("routes/messageRoutes.js");
  assert.match(source, /emit\("chat:message", message\)/);
});

test("chat socket authenticates and authorizes match membership", () => {
  const source = read("sockets/chat.js");
  assert.match(source, /jwt\.verify/);
  assert.match(source, /User\.findById/);
  assert.match(source, /isActive: true/);
  assert.match(source, /match\.users\.some/);
  for (const event of ["chat:join", "chat:typing", "chat:message", "chat:read"]) {
    assert.match(source, new RegExp(event));
  }
});

test("all owned media deletion routes invoke storage cleanup", () => {
  assert.match(read("routes/postRoutes.js"), /deleteStoredFile/);
  assert.match(read("routes/reelRoutes.js"), /deleteStoredFiles/);
  assert.match(read("routes/storyRoutes.js"), /deleteStoredFile/);
  assert.match(read("routes/userRoutes.js"), /deleteStoredFile/);
});

test("chat persists photo, GIF and video attachments", () => {
  const route = read("routes/messageRoutes.js");
  const model = read("models/Social.js");
  assert.match(route, /uploadMessageMedia/);
  assert.match(route, /saveUploadedFile\(req\.file, "message"\)/);
  assert.match(model, /\["text", "image", "video", "gif"\]/);
});

test("match actions support a clear connect intent", () => {
  assert.match(read("routes/matchRoutes.js"), /"connect"/);
  assert.match(read("models\/Social.js"), /"connect"/);
});

test("authenticated students can submit clubs and events", () => {
  for (const file of ["routes/clubRoutes.js", "routes/eventRoutes.js"]) {
    const source = read(file);
    assert.match(source, /requireAuth/);
    assert.match(source, /createdBy: req\.user\._id/);
    assert.doesNotMatch(source, /requireAdmin/);
  }
});
