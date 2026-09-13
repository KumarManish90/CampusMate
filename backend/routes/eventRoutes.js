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
    const { title, description, date, venue } = req.body;
    const cleanTitle = String(title || "").trim();
    const eventDate = new Date(date);
    if (cleanTitle.length < 3 || cleanTitle.length > 100) return res.status(400).json({ message: "Event title must be 3–100 characters." });
    if (Number.isNaN(eventDate.getTime()) || eventDate <= new Date()) return res.status(400).json({ message: "Choose a valid upcoming date and time." });
    if (String(description || "").length > 1000 || String(venue || "").length > 120) return res.status(400).json({ message: "Event details are too long." });

    let image;
    if (req.file) {
      const saved = await saveUploadedFile(req.file, "event");
      image = { url: saved.url, publicId: saved.publicId };
    }
    const event = await Event.create({
      title: cleanTitle,
      college: req.user.collegeName,
      description: String(description || "").trim(),
      date: eventDate,
      venue: String(venue || "").trim(),
      organizer: req.user.name,
      image,
      createdBy: req.user._id,
      submissionSource: req.user.isAdmin ? "admin" : "student",
      participants: [req.user._id],
    });
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
