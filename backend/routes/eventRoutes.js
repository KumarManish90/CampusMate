const express = require("express");
const { Event } = require("../models/Campus");
const { requireAuth } = require("../middleware/auth");
const { uploadEventImage } = require("../middleware/upload");
const { saveUploadedFile } = require("../config/media");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { college } = req.query;
    const filter = college && college !== "All" ? { college } : {};
    const events = await Event.find(filter).sort({ date: 1 }).limit(200);
    res.json({ events });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id).populate("participants", "name profilePhoto collegeName");
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ event });
  })
);

router.post(
  "/",
  requireAuth,
  uploadEventImage,
  asyncHandler(async (req, res) => {
    const { title, college, description, date, venue, organizer } = req.body;
    if (!title || !college || !date) return res.status(400).json({ message: "title, college and date are required." });

    let image;
    if (req.file) {
      const saved = await saveUploadedFile(req.file, "event");
      image = { url: saved.url, publicId: saved.publicId };
    }
    const event = await Event.create({ title, college, description, date, venue, organizer, image });
    res.status(201).json({ event });
  })
);

router.post(
  "/:id/register",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    if (!event.participants.some((p) => String(p) === String(req.user._id))) {
      event.participants.push(req.user._id);
      await event.save();
    }
    res.json({ event });
  })
);

module.exports = router;
