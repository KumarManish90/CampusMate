const express = require("express");
const { Match, Message } = require("../models/Social");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, paginate } = require("../utils/helpers");

const router = express.Router();

async function assertParty(matchId, userId) {
  const match = await Match.findById(matchId);
  if (!match) return null;
  if (!match.users.some((u) => String(u) === String(userId))) return false;
  return match;
}

// GET /api/messages/:matchId
router.get(
  "/:matchId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const match = await assertParty(req.params.matchId, req.user._id);
    if (match === null) return res.status(404).json({ message: "Match not found." });
    if (match === false) return res.status(403).json({ message: "Not your conversation." });

    const { page, limit, skip } = paginate(req, 30, 100);
    const messages = await Message.find({ match: match._id, deletedFor: { $ne: req.user._id } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ messages: messages.reverse(), page });
  })
);

// POST /api/messages { matchId, text }
// Also emitted over Socket.IO for real-time delivery (see sockets/chat.js) — this
// REST endpoint exists so message history persists even for offline recipients.
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { matchId, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Message text is required." });

    const match = await assertParty(matchId, req.user._id);
    if (match === null) return res.status(404).json({ message: "Match not found." });
    if (match === false) return res.status(403).json({ message: "Not your conversation." });

    const message = await Message.create({ match: match._id, sender: req.user._id, text: text.trim(), readBy: [req.user._id] });
    match.lastMessageAt = new Date();
    await match.save();

    req.app.get("io")?.to(`match:${match._id}`).emit("chat:message", message);

    res.status(201).json({ message });
  })
);

module.exports = router;
