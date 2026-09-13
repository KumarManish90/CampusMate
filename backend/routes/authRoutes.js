const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { z } = require("zod");
const User = require("../models/User");
const College = require("../models/College");
const { asyncHandler, signToken } = require("../utils/helpers");
const { requireAuth } = require("../middleware/auth");
const { sendEmailOtp } = require("../config/email");

const router = express.Router();

// Signup no longer requires a college-provided student database or an
// institutional email — `college` is resolved to a College document (found
// by id, or found/created by name) purely as a profile attribute.
const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  collegeId: z.string().optional(),
  collegeName: z.string().optional(),
  collegeCity: z.string().optional(),
  course: z.string().optional(),
  branch: z.string().optional(),
  year: z.string().optional(),
}).refine((d) => d.collegeId || d.collegeName, { message: "Select or add your college." });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function classifyEmail(email, collegeDomain) {
  if (collegeDomain && email.toLowerCase().endsWith(`@${collegeDomain.toLowerCase()}`)) return "college";
  return "personal";
}

// POST /api/auth/register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const { name, email, password, collegeId, collegeName, collegeCity, course, branch, year } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with that email already exists." });

    // Resolve college: use the chosen one, or find-or-create by name+city
    // ("Can't find your college? Add your college" flow). Newly-added
    // colleges are marked "community_added", never implying an official
    // partnership or that the student has been institutionally verified.
    let college = collegeId ? await College.findById(collegeId) : null;
    if (!college && collegeName) {
      college = await College.findOne({ name: collegeName.trim(), city: collegeCity?.trim() }).collation({ locale: "en", strength: 2 });
      if (!college) {
        college = await College.create({ name: collegeName.trim(), city: collegeCity?.trim(), verificationStatus: "community_added" });
      }
    }
    if (!college) return res.status(400).json({ message: "College not found. Provide collegeId or collegeName." });

    const passwordHash = await bcrypt.hash(password, 12);
    const emailType = classifyEmail(email, college.domain);

    const user = await User.create({
      name, email: email.toLowerCase(), passwordHash, emailType,
      college: college._id, collegeName: college.name, course, branch, year,
    });
    await College.updateOne({ _id: college._id }, { $inc: { studentCount: 1 } });

    res.status(201).json({ token: signToken(user), user: user.toPublicJSON() });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid email and password are required." });
    const { email, password } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Incorrect email or password." });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Incorrect email or password." });

    user.lastActiveAt = new Date();
    await user.save();

    res.json({ token: signToken(user), user: user.toPublicJSON() });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user.toPublicJSON() });
  })
);

// ---- Lightweight OTP-based email verification (works for personal OR
// college email — verifying an inbox is a separate, lower-stakes claim
// than verifying institutional enrollment; see /verify-college below). ----
//
router.post(
  "/send-otp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const otp = String(crypto.randomInt(100000, 1000000));
    req.user.emailOtpHash = await bcrypt.hash(otp, 8);
    req.user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await req.user.save();
    await sendEmailOtp(req.user.email, otp);

    const devMode = process.env.NODE_ENV !== "production";
    res.json({ message: "Verification code sent.", ...(devMode ? { devOtp: otp } : {}) });
  })
);

router.post(
  "/verify-otp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!/^\d{6}$/.test(String(otp || ""))) return res.status(400).json({ message: "Enter a valid 6-digit code." });
    const user = await User.findById(req.user._id).select("+emailOtpHash +emailOtpExpiresAt");
    if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }
    const ok = await bcrypt.compare(String(otp || ""), user.emailOtpHash);
    if (!ok) return res.status(400).json({ message: "Incorrect code." });

    user.verificationStatus = user.verificationStatus === "college_verified" ? "college_verified" : "email_verified";
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    await user.save();

    res.json({ user: user.toPublicJSON() });
  })
);

// POST /api/auth/verify-college — separate, optional, higher-bar claim than
// email verification. Auto-approves only when the user's email domain
// matches their chosen College.domain; otherwise flags for manual/admin
// review rather than silently approving. Demo accounts can never reach
// college_verified, so fictional seed data is never mistaken for a real student.
router.post(
  "/verify-college",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.isDemoAccount) {
      return res.status(400).json({ message: "Demo accounts cannot be marked as verified students." });
    }
    const College = require("../models/College");
    const college = await College.findById(req.user.college);
    const domainMatches = college?.domain && req.user.email.toLowerCase().endsWith(`@${college.domain.toLowerCase()}`);

    if (!domainMatches) {
      return res.status(202).json({ message: "Submitted for manual review — your email domain doesn't match your college's on file yet." });
    }
    req.user.verificationStatus = "college_verified";
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  })
);

module.exports = router;
