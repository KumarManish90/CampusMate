require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const Post = require("../models/Post");
const Reel = require("../models/Reel");
const Story = require("../models/Story");
const User = require("../models/User");

const apply = process.argv.includes("--apply");
const prefix = "campusmate/";

async function referencedPublicIds() {
  const [posts, reels, stories, users] = await Promise.all([
    Post.find({}).select("media thumbnail").lean(), Reel.find({}).select("videoPublicId thumbnailPublicId").lean(),
    Story.find({}).select("mediaPublicId").lean(), User.find({}).select("profilePhoto").lean(),
  ]);
  return new Set([
    ...posts.flatMap(p => [...(p.media || []).map(m => m.publicId), p.thumbnail?.publicId]),
    ...reels.flatMap(r => [r.videoPublicId, r.thumbnailPublicId]), ...stories.map(s => s.mediaPublicId),
    ...users.map(u => u.profilePhoto?.publicId),
  ].filter(Boolean));
}

async function cleanupCloudinary(referenced) {
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  const resources = [];
  for (const resourceType of ["image", "video"]) {
    let nextCursor;
    do {
      const page = await cloudinary.api.resources({ type: "upload", resource_type: resourceType, prefix, max_results: 500, next_cursor: nextCursor });
      resources.push(...page.resources.map(r => ({ publicId: r.public_id, resourceType })));
      nextCursor = page.next_cursor;
    } while (nextCursor);
  }
  const orphans = resources.filter(r => !referenced.has(r.publicId));
  if (apply) await Promise.all(orphans.map(r => cloudinary.uploader.destroy(r.publicId, { resource_type: r.resourceType, invalidate: true })));
  return orphans.map(x => x.publicId);
}

async function cleanupLocal(referencedUrls) {
  const root = path.resolve(__dirname, "..", "uploads"), files = [];
  const walk = dir => { if (!fs.existsSync(dir)) return; for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, item.name); item.isDirectory() ? walk(full) : files.push(full); } };
  walk(root);
  const orphans = files.filter(file => !referencedUrls.has(`/${path.relative(path.resolve(__dirname, ".."), file).replace(/\\/g, "/")}`));
  if (apply) await Promise.all(orphans.map(file => fs.promises.unlink(file)));
  return orphans.map(file => path.relative(root, file));
}

(async () => {
  await connectDB();
  const refs = await referencedPublicIds();
  let orphans;
  if ((process.env.MEDIA_STORAGE_MODE || "local") === "cloudinary") orphans = await cleanupCloudinary(refs);
  else {
    const [posts, reels, stories, users] = await Promise.all([Post.find({}).lean(), Reel.find({}).lean(), Story.find({}).lean(), User.find({}).lean()]);
    const urls = new Set([...posts.flatMap(p => [...(p.media || []).map(m => m.url), p.thumbnail?.url]), ...reels.flatMap(r => [r.videoUrl, r.thumbnailUrl]), ...stories.map(s => s.mediaUrl), ...users.map(u => u.profilePhoto?.url)].filter(Boolean));
    orphans = await cleanupLocal(urls);
  }
  console.log(JSON.stringify({ mode: process.env.MEDIA_STORAGE_MODE || "local", apply, orphanCount: orphans.length, orphans }, null, 2));
  process.exit(orphans.length && !apply ? 2 : 0);
})().catch(error => { console.error(error); process.exit(1); });
