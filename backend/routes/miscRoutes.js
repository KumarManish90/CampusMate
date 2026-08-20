const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const Reel = require("../models/Reel");
const { Club, Event, Notification, Report } = require("../models/Campus");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, paginate } = require("../utils/helpers");

const router = express.Router();

// ---------- Notifications ----------
router.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req, 20, 50);
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name profilePhoto collegeName");
    res.json({ notifications, page });
  })
);

router.post(
  "/notifications/read-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read." });
  })
);

// ---------- Search ----------
// GET /api/search?q=hackathon
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ users: [], posts: [], reels: [], clubs: [], events: [], hashtags: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [users, posts, reels, clubs, events] = await Promise.all([
      User.find({ $or: [{ name: regex }, { bio: regex }] }).limit(10),
      Post.find({ $or: [{ caption: regex }, { hashtags: regex }] }).sort({ createdAt: -1 }).limit(10),
      Reel.find({ $or: [{ caption: regex }, { hashtags: regex }] }).sort({ createdAt: -1 }).limit(10),
      Club.find({ name: regex }).limit(10),
      Event.find({ title: regex }).limit(10),
    ]);

    const hashtagMatches = q.startsWith("#") ? [q] : [];

    res.json({
      users: users.map((u) => u.toPublicJSON()),
      posts,
      reels,
      clubs,
      events,
      hashtags: hashtagMatches,
    });
  })
);

// GET /api/hashtags/:tag
router.get(
  "/hashtags/:tag",
  asyncHandler(async (req, res) => {
    const tag = req.params.tag.startsWith("#") ? req.params.tag : `#${req.params.tag}`;
    const [posts, reels] = await Promise.all([
      Post.find({ hashtags: tag }).sort({ createdAt: -1 }).limit(50).populate("author", "name profilePhoto collegeName"),
      Reel.find({ hashtags: tag }).sort({ createdAt: -1 }).limit(50).populate("author", "name profilePhoto collegeName"),
    ]);
    res.json({ tag, posts, reels });
  })
);

// ---------- Reports ----------
router.post(
  "/reports",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { targetType, targetId, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "targetType, targetId and reason are required." });
    }
    const report = await Report.create({ reporter: req.user._id, targetType, targetId, reason, details });
    res.status(201).json({ report });
  })
);

module.exports = router;
