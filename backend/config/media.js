/**
 * Media storage abstraction.
 *
 * MEDIA_STORAGE_MODE=local      -> files are written to backend/uploads and served
 *                                   via Express static middleware.
 * MEDIA_STORAGE_MODE=cloudinary -> files are streamed to Cloudinary; only the
 *                                   returned secure_url / public_id are persisted
 *                                   in MongoDB.
 */
const path = require("path");
const fs = require("fs");

const MODE = process.env.MEDIA_STORAGE_MODE || "local";

let cloudinary = null;
if (MODE === "cloudinary") {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const FOLDERS = {
  profile: "campusmate/profiles",
  post: "campusmate/posts",
  reel: "campusmate/reels",
  story: "campusmate/stories",
  thumbnail: "campusmate/reel-thumbnails",
  event: "campusmate/events",
  club: "campusmate/clubs",
};

async function saveUploadedFile(file, kind) {
  if (MODE === "cloudinary") {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: FOLDERS[kind] || "campusmate/misc",
        resource_type: "auto",
      });
      return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, resourceType: result.resource_type };
    } finally {
      await fs.promises.unlink(file.path).catch(() => null);
    }
  }

  const folderName = kind === "thumbnail" ? "thumbnails" : `${kind}s`;
  const relative = path.join("uploads", folderName, path.basename(file.path));
  return { url: `/${relative.replace(/\\/g, "/")}`, publicId: null };
}

async function deleteStoredFile(media) {
  if (!media) return;

  if (MODE === "cloudinary") {
    if (!media.publicId) return;
    await cloudinary.uploader.destroy(media.publicId, { resource_type: "image", invalidate: true })
      .catch(async () => cloudinary.uploader.destroy(media.publicId, { resource_type: "video", invalidate: true }).catch(() => null));
    return;
  }

  if (!media.url || !media.url.startsWith("/uploads/")) return;
  const relativePath = media.url.replace(/^\//, "");
  const uploadRoot = path.resolve(process.cwd(), "uploads");
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (absolutePath !== uploadRoot && absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
    await fs.promises.unlink(absolutePath).catch((error) => { if (error.code !== "ENOENT") throw error; });
  }
}

async function deleteStoredFiles(mediaItems) {
  await Promise.all((mediaItems || []).filter(Boolean).map(deleteStoredFile));
}

module.exports = { saveUploadedFile, deleteStoredFile, deleteStoredFiles, MODE };
