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
    const result = await cloudinary.uploader.upload(file.path, {
      folder: FOLDERS[kind] || "campusmate/misc",
      resource_type: "auto",
    });
    fs.unlink(file.path, () => {});
    return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, resourceType: result.resource_type };
  }

  const folderName = kind === "thumbnail" ? "thumbnails" : `${kind}s`;
  const relative = path.join("uploads", folderName, path.basename(file.path));
  return { url: `/${relative.replace(/\\/g, "/")}`, publicId: null };
}

module.exports = { saveUploadedFile, MODE };
