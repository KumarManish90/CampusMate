const express = require("express");
const { Connection } = require("../models/Social");
const { Notification } = require("../models/Campus");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

// GET /api/connections — accepted connections + pending requests for the current user
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [accepted, incoming, outgoing] = await Promise.all([
      Connection.find({ status: "accepted", $or: [{ requester: req.user._id }, { recipient: req.user._id }] })
        .populate("requester recipient", "name profilePhoto collegeName branch year"),
      Connection.find({ status: "pending", recipient: req.user._id }).populate("requester", "name profilePhoto collegeName"),
      Connection.find({ status: "pending", requester: req.user._id }).populate("recipient", "name profilePhoto collegeName"),
    ]);
    res.json({ accepted, incoming, outgoing });
  })
);

// POST /api/connections { recipient, context }
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { recipient, context } = req.body;
    if (!recipient) return res.status(400).json({ message: "recipient is required." });
    if (String(recipient) === String(req.user._id)) return res.status(400).json({ message: "You can't connect with yourself." });

    const target = await User.findById(recipient);
    if (!target) return res.status(404).json({ message: "User not found." });

    const connection = await Connection.findOneAndUpdate(
      { requester: req.user._id, recipient },
      { requester: req.user._id, recipient, context: context || "networking", status: "pending" },
      { upsert: true, new: true }
    );
    await Notification.create({ user: recipient, actor: req.user._id, type: "connection_request" });

    res.status(201).json({ connection });
  })
);

// POST /api/connections/:id/accept | /decline
router.post(
  "/:id/accept",
  requireAuth,
  asyncHandler(async (req, res) => {
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: "Request not found." });
    if (String(connection.recipient) !== String(req.user._id)) return res.status(403).json({ message: "Not your request." });

    connection.status = "accepted";
    await connection.save();
    await User.updateOne({ _id: connection.requester }, { $inc: { connectionsCount: 1 } });
    await User.updateOne({ _id: connection.recipient }, { $inc: { connectionsCount: 1 } });
    await Notification.create({ user: connection.requester, actor: req.user._id, type: "connection_accepted" });

    res.json({ connection });
  })
);

router.post(
  "/:id/decline",
  requireAuth,
  asyncHandler(async (req, res) => {
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: "Request not found." });
    if (String(connection.recipient) !== String(req.user._id)) return res.status(403).json({ message: "Not your request." });
    connection.status = "declined";
    await connection.save();
    res.json({ connection });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const connection = await Connection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: "Not found." });
    const isParty = [connection.requester, connection.recipient].some((id) => String(id) === String(req.user._id));
    if (!isParty) return res.status(403).json({ message: "Not your connection." });

    if (connection.status === "accepted") {
      await User.updateOne({ _id: connection.requester }, { $inc: { connectionsCount: -1 } });
      await User.updateOne({ _id: connection.recipient }, { $inc: { connectionsCount: -1 } });
    }
    await connection.deleteOne();
    res.json({ message: "Connection removed." });
  })
);

module.exports = router;
