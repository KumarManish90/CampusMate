const express = require("express");
const Reel = require("../models/Reel");
const { Notification } = require("../models/Campus");
const { requireAuth } = require("../middleware/auth");
const { uploadReelVideo, uploadReelThumbnail } = require("../middleware/upload");
const { saveUploadedFile, deleteStoredFile, deleteStoredFiles } = require("../config/media");
const { asyncHandler, paginate } = require("../utils/helpers");

const router = express.Router();

// GET /api/reels?college=GGITS&page=1
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { college } = req.query;
    const { page, limit, skip } = paginate(req, 10, 25);
    const filter = college && college !== "All" ? { college } : {};
    const reels = await Reel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name profilePhoto collegeName verificationStatus");
    res.json({ reels, page, hasMore: reels.length === limit });
  })
);

// GET /api/reels/trending — ranked by a modular popularity function
router.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const reels = await Reel.find({}).sort({ createdAt: -1 }).limit(200).populate("author", "name profilePhoto collegeName");
    const ranked = reels
      .map((r) => ({
        reel: r,
        score: r.viewsCount * 1 + r.likes.length * 4 + r.commentsCount * 6 + r.sharesCount * 8 + r.savedBy.length * 5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => r.reel);
    res.json({ reels: ranked });
  })
);

// GET /api/reels/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id).populate("author", "name profilePhoto collegeName verificationStatus");
    if (!reel) return res.status(404).json({ message: "Reel not found." });
    res.json({ reel });
  })
);

// POST /api/reels — multipart/form-data { video, thumbnail, caption, hashtags, duration }
router.post(
  "/",
  requireAuth,
  uploadReelVideo,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "A video file is required." });
    const savedVideo = await saveUploadedFile(req.file, "reel");

    const { caption = "", hashtags = "", audioName, duration, thumbnailUrl } = req.body;

    let reel;
    try {
      reel = await Reel.create({ author: req.user._id, college: req.user.collegeName, videoUrl: savedVideo.url, videoPublicId: savedVideo.publicId, thumbnailUrl: thumbnailUrl || savedVideo.url, duration: Number(duration) || 10, caption, audioName, hashtags: String(hashtags).split(",").map((h) => h.trim()).filter(Boolean) });
    } catch (error) {
      await deleteStoredFile(savedVideo).catch(() => null);
      throw error;
    }

    res.status(201).json({ reel });
  })
);

// POST /api/reels/:id/thumbnail — multipart/form-data { thumbnail }
router.post(
  "/:id/thumbnail",
  requireAuth,
  uploadReelThumbnail,
  asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found." });
    if (String(reel.author) !== String(req.user._id)) return res.status(403).json({ message: "Not your reel." });
    if (!req.file) return res.status(400).json({ message: "No thumbnail was uploaded." });

    const saved = await saveUploadedFile(req.file, "thumbnail");
    const previousThumbnail = reel.thumbnailPublicId ? { url: reel.thumbnailUrl, publicId: reel.thumbnailPublicId } : null;
    reel.thumbnailUrl = saved.url;
    reel.thumbnailPublicId = saved.publicId;
    await reel.save();
    await deleteStoredFile(previousThumbnail).catch(() => null);
    res.json({ reel });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found." });
    if (String(reel.author) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own reels." });
    }
    await deleteStoredFiles([
      { url: reel.videoUrl, publicId: reel.videoPublicId },
      reel.thumbnailPublicId ? { url: reel.thumbnailUrl, publicId: reel.thumbnailPublicId } : null,
    ]);
    await reel.deleteOne();
    res.json({ message: "Reel deleted." });
  })
);

router.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found." });
    const already = reel.likes.some((id) => String(id) === String(req.user._id));
    if (already) {
      reel.likes = reel.likes.filter((id) => String(id) !== String(req.user._id));
    } else {
      reel.likes.push(req.user._id);
      if (String(reel.author) !== String(req.user._id)) {
        await Notification.create({ user: reel.author, actor: req.user._id, type: "like_reel", reel: reel._id });
      }
    }
    await reel.save();
    res.json({ liked: !already, likesCount: reel.likes.length });
  })
);

router.post(
  "/:id/save",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found." });
    const already = reel.savedBy.some((id) => String(id) === String(req.user._id));
    reel.savedBy = already
      ? reel.savedBy.filter((id) => String(id) !== String(req.user._id))
      : [...reel.savedBy, req.user._id];
    await reel.save();
    res.json({ saved: !already });
  })
);

// POST /api/reels/:id/view — only counts once a "meaningful watch" threshold is
// hit on the frontend (the frontend debounces this call after ~2s of playback),
// and only once per viewer, so re-scrolling never inflates the count.
router.post(
  "/:id/view",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found." });
    const alreadyViewed = reel.viewedBy.some((id) => String(id) === String(req.user._id));
    if (!alreadyViewed) {
      reel.viewedBy.push(req.user._id);
      reel.viewsCount += 1;
      await reel.save();
    }
    res.json({ viewsCount: reel.viewsCount });
  })
);

module.exports = router;
