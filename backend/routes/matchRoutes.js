const express = require("express");
const User = require("../models/User");
const { Swipe, Match } = require("../models/Social");
const { Notification } = require("../models/Campus");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, paginate } = require("../utils/helpers");

const router = express.Router();

// GET /api/discover?college=All — candidates the current user hasn't swiped on yet
router.get(
  "/discover",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { college } = req.query;
    const { limit } = paginate(req, 20, 40);

    const swiped = (await Swipe.find({ from: req.user._id }).select("to")).map((s) => s.to);
    const filter = { _id: { $ne: req.user._id, $nin: swiped } };
    if (college && college !== "All") filter.collegeName = college;

    const candidates = await User.find(filter).limit(limit);
    res.json({ candidates: candidates.map((c) => c.toPublicJSON()) });
  })
);

// POST /api/swipes { to, action: "like"|"pass"|"super_like" }
router.post(
  "/swipes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { to, action } = req.body;
    if (!to || !["like", "pass", "super_like"].includes(action)) {
      return res.status(400).json({ message: "A target user and valid action are required." });
    }
    if (String(to) === String(req.user._id)) return res.status(400).json({ message: "You can't swipe on yourself." });

    await Swipe.findOneAndUpdate({ from: req.user._id, to }, { from: req.user._id, to, action }, { upsert: true });

    let matched = null;
    if (action !== "pass") {
      const reciprocal = await Swipe.findOne({ from: to, to: req.user._id, action: { $in: ["like", "super_like"] } });
      if (reciprocal) {
        matched = await Match.create({ users: [req.user._id, to] });
        await Notification.create({ user: to, actor: req.user._id, type: "match" });
        await Notification.create({ user: req.user._id, actor: to, type: "match" });
      }
    }

    res.json({ matched: !!matched, match: matched });
  })
);

// GET /api/matches
router.get(
  "/matches",
  requireAuth,
  asyncHandler(async (req, res) => {
    const matches = await Match.find({ users: req.user._id, isActive: true })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .populate("users", "name profilePhoto collegeName branch year");
    const shaped = matches.map((m) => ({
      _id: m._id,
      user: m.users.find((u) => String(u._id) !== String(req.user._id)),
      lastMessageAt: m.lastMessageAt,
      createdAt: m.createdAt,
    }));
    res.json({ matches: shaped });
  })
);

// DELETE /api/matches/:id — unmatch
router.delete(
  "/matches/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found." });
    if (!match.users.some((u) => String(u) === String(req.user._id))) {
      return res.status(403).json({ message: "Not your match." });
    }
    match.isActive = false;
    await match.save();
    res.json({ message: "Unmatched." });
  })
);

module.exports = router;
