const express = require("express");
const Story = require("../models/Story");
const { requireAuth } = require("../middleware/auth");
const { uploadStoryMedia } = require("../middleware/upload");
const { saveUploadedFile, deleteStoredFile } = require("../config/media");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

// GET /api/stories — active (non-expired) stories, grouped by author on the frontend.
// Mongo's TTL index on `expiresAt` removes expired documents automatically, so a
// simple "find all" here already excludes anything past its 24h window.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(300).populate("author", "name profilePhoto collegeName");
    res.json({ stories });
  })
);

// POST /api/stories — multipart/form-data { media?, type, textOverlay?, backgroundColor? }
router.post(
  "/",
  requireAuth,
  uploadStoryMedia,
  asyncHandler(async (req, res) => {
    const { type = "image", textOverlay, backgroundColor } = req.body;
    let mediaUrl, mediaPublicId;

    if (type !== "text") {
      if (!req.file) return res.status(400).json({ message: "Media is required for photo/video stories." });
      const saved = await saveUploadedFile(req.file, "story");
      mediaUrl = saved.url;
      mediaPublicId = saved.publicId;
    }

    let story;
    try {
      story = await Story.create({ author: req.user._id, college: req.user.collegeName, type, mediaUrl, mediaPublicId, textOverlay, backgroundColor, expiresAt: Story.defaultExpiry() });
    } catch (error) {
      await deleteStoredFile({ url: mediaUrl, publicId: mediaPublicId }).catch(() => null);
      throw error;
    }

    res.status(201).json({ story });
  })
);

// POST /api/stories/:id/view
router.post(
  "/:id/view",
  requireAuth,
  asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found or expired." });
    if (!story.viewedBy.some((id) => String(id) === String(req.user._id))) {
      story.viewedBy.push(req.user._id);
      await story.save();
    }
    res.json({ viewersCount: story.viewedBy.length });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found." });
    if (String(story.author) !== String(req.user._id)) return res.status(403).json({ message: "Not your story." });
    await deleteStoredFile({ url: story.mediaUrl, publicId: story.mediaPublicId });
    await story.deleteOne();
    res.json({ message: "Story deleted." });
  })
);

module.exports = router;
