const express = require("express");
const mongoose = require("mongoose");
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
    const filter = {
      _id: { $ne: req.user._id, $nin: swiped },
      isActive: true,
      isSuspended: { $ne: true },
    };
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
    if (!to || !mongoose.isValidObjectId(to) || !["like", "pass", "super_like"].includes(action)) {
      return res.status(400).json({ message: "A target user and valid action are required." });
    }
    if (String(to) === String(req.user._id)) return res.status(400).json({ message: "You can't swipe on yourself." });

    const target = await User.exists({ _id: to, isActive: true, isSuspended: { $ne: true } });
    if (!target) return res.status(404).json({ message: "This student is no longer available." });

    await Swipe.findOneAndUpdate(
      { from: req.user._id, to },
      { $set: { action } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    let matched = null;
    if (action !== "pass") {
      const reciprocal = await Swipe.findOne({ from: to, to: req.user._id, action: { $in: ["like", "super_like"] } });
      if (reciprocal) {
        const pairKey = [String(req.user._id), String(to)].sort().join(":");
        const existing = await Match.findOne({
          $or: [
            { pairKey },
            { users: { $all: [req.user._id, to], $size: 2 } },
          ],
        });
        let createdNew = false;
        try {
          matched = existing || await Match.create({ users: [req.user._id, to], pairKey });
          createdNew = !existing;
        } catch (error) {
          if (error.code !== 11000) throw error;
          matched = await Match.findOne({ pairKey });
        }
        if (createdNew) {
          await Promise.all([
            Notification.create({ user: to, actor: req.user._id, type: "match" }),
            Notification.create({ user: req.user._id, actor: to, type: "match" }),
          ]);
        }
      }
    }

    res.json({ matched: !!matched, match: matched });
  })
);

// DELETE /api/swipes/passed — allow a user to review profiles they passed on.
router.delete(
  "/swipes/passed",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await Swipe.deleteMany({ from: req.user._id, action: "pass" });
    res.json({ resetCount: result.deletedCount || 0 });
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
