const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const College = require("../models/College");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

const collegeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
});
const addCollegeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many colleges added from this network. Please try again later." },
});

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
  addCollegeLimiter,
  asyncHandler(async (req, res) => {
    const parsed = collegeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const { name, city, state } = parsed.data;

    const existing = await College.findOne({ name, city }).collation({ locale: "en", strength: 2 });
    if (existing) return res.status(200).json({ college: existing, alreadyExisted: true });

    const college = await College.create({
      name, city, state,
      verificationStatus: "community_added",
    });
    res.status(201).json({ college });
  })
);

module.exports = router;
