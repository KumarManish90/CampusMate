const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

const MAX_IMAGE_MB = Number(process.env.MAX_IMAGE_SIZE_MB || 10);
const MAX_VIDEO_MB = Number(process.env.MAX_VIDEO_SIZE_MB || 100);

function destinationFor(kind) {
  const dir = path.join(__dirname, "..", "uploads", `${kind}s`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeUploader(kind, { allowVideo = false } = {}) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationFor(kind)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${kind}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowed = allowVideo ? [...IMAGE_TYPES, ...VIDEO_TYPES] : IMAGE_TYPES;
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  };

  const isVideoRequest = (req) => allowVideo; // limit picked conservatively per-field below

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: Math.max(MAX_IMAGE_MB, allowVideo ? MAX_VIDEO_MB : 0) * 1024 * 1024 },
  });
}

module.exports = {
  uploadProfilePhoto: makeUploader("profile").single("photo"),
  uploadPostMedia: makeUploader("post").array("media", 10),
  uploadReelVideo: makeUploader("reel", { allowVideo: true }).single("video"),
  uploadReelThumbnail: makeUploader("thumbnail").single("thumbnail"),
  uploadStoryMedia: makeUploader("story", { allowVideo: true }).single("media"),
  uploadEventImage: makeUploader("event").single("image"),
  uploadClubImage: makeUploader("club").single("image"),
};
