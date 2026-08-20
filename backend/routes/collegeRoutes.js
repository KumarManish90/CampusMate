const express = require("express");
const College = require("../models/College");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

// GET /api/colleges?search=ggi — used by the signup/onboarding college picker.
// Returns the top matches; an empty/short query returns the most-populous
// colleges first so the picker isn't empty by default.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = (req.query.search || "").trim();
    const filter = q ? { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {};
    const colleges = await College.find(filter).sort({ studentCount: -1, name: 1 }).limit(20);
    res.json({ colleges });
  })
);

// POST /api/colleges — "Can't find your college? Add your college."
// Intentionally public (no auth) since this needs to work *during* signup,
// before a new student has a token yet. It starts as "community_added", not
// an official CampusMate partner, and is immediately usable at signup.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, city, state } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "College name is required." });

    const existing = await College.findOne({ name: name.trim(), city: city?.trim() }).collation({ locale: "en", strength: 2 });
    if (existing) return res.status(200).json({ college: existing, alreadyExisted: true });

    const college = await College.create({
      name: name.trim(), city: city?.trim(), state: state?.trim(),
      verificationStatus: "community_added",
    });
    res.status(201).json({ college });
  })
);

module.exports = router;
