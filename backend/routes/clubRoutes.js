const express = require("express");
const { Club } = require("../models/Campus");
const { requireAuth } = require("../middleware/auth");
const { uploadClubImage } = require("../middleware/upload");
const { saveUploadedFile } = require("../config/media");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { college } = req.query;
    const filter = college && college !== "All" ? { college } : {};
    const clubs = await Club.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ clubs });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const club = await Club.findById(req.params.id).populate("members", "name profilePhoto collegeName");
    if (!club) return res.status(404).json({ message: "Club not found." });
    res.json({ club });
  })
);

router.post(
  "/",
  requireAuth,
  uploadClubImage,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const cleanName = String(name || "").trim();
    const cleanDescription = String(description || "").trim();
    if (cleanName.length < 3 || cleanName.length > 80) return res.status(400).json({ message: "Community name must be 3–80 characters." });
    if (cleanDescription.length > 500) return res.status(400).json({ message: "Description must be 500 characters or less." });

    let logo;
    if (req.file) {
      const saved = await saveUploadedFile(req.file, "club");
      logo = { url: saved.url, publicId: saved.publicId };
    }
    const club = await Club.create({
      name: cleanName,
      college: req.user.collegeName,
      description: cleanDescription,
      logo,
      createdBy: req.user._id,
      submissionSource: req.user.isAdmin ? "admin" : "student",
      admins: [req.user._id],
      members: [req.user._id],
    });
    res.status(201).json({ club });
  })
);

router.post(
  "/:id/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });
    if (!club.members.some((m) => String(m) === String(req.user._id))) {
      club.members.push(req.user._id);
      await club.save();
    }
    res.json({ club });
  })
);

router.post(
  "/:id/leave",
  requireAuth,
  asyncHandler(async (req, res) => {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });
    club.members = club.members.filter((m) => String(m) !== String(req.user._id));
    await club.save();
    res.json({ club });
  })
);

module.exports = router;
