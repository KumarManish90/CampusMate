/**
 * Media storage abstraction.
 *
 * MEDIA_STORAGE_MODE=local      -> files are written to backend/uploads and served
 *                                   via Express static middleware (see server.js).
 * MEDIA_STORAGE_MODE=cloudinary -> files are streamed to Cloudinary; only the
 *                                   returned secure_url / public_id are persisted
 *                                   in MongoDB.
 *
 * Every route in this project calls `saveUploadedFile()` below rather than
 * touching multer/cloudinary directly, so switching modes never requires
 * touching controller code.
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
  event: "campusmate/events",
  club: "campusmate/clubs",
};

/**
 * @param {Express.Multer.File} file - file written to disk by multer (diskStorage)
 * @param {"profile"|"post"|"reel"|"story"|"event"|"club"} kind
 * @returns {Promise<{url: string, publicId: string|null, width?: number, height?: number}>}
 */
async function saveUploadedFile(file, kind) {
  if (MODE === "cloudinary") {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: FOLDERS[kind] || "campusmate/misc",
      resource_type: "auto",
    });
    fs.unlink(file.path, () => {}); // clean up local temp file
    return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
  }

  // local mode: multer already wrote the file under uploads/<kind>s/<filename>
  const relative = path.join("uploads", `${kind}s`, path.basename(file.path));
  return { url: `/${relative.replace(/\\/g, "/")}`, publicId: null };
}

module.exports = { saveUploadedFile, MODE };
