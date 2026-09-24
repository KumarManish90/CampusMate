const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../models/User");
const College = require("../models/College");
const OtpChallenge = require("../models/OtpChallenge");
const { asyncHandler, signToken } = require("../utils/helpers");
const { sendEmailOtp } = require("../config/email");
const { sendSmsOtp } = require("../config/sms");
const router = express.Router();

const contactSchema = z.object({
  channel: z.enum(["email", "phone"]),
  contact: z.string().trim().min(3).max(254),
});
const verifySchema = contactSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  name: z.string().trim().min(2).max(60).optional(),
  collegeId: z.string().optional(),
  collegeName: z.string().trim().max(120).optional(),
  collegeCity: z.string().trim().max(80).optional(),
  course: z.string().trim().max(80).optional(),
  branch: z.string().trim().max(80).optional(),
  year: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]).optional(),
});
function normalize(channel, contact) {
  const value = contact.trim();
  if (channel === "email") return z.string().email().parse(value.toLowerCase());
  if (!/^\+[1-9]\d{7,14}$/.test(value)) throw Object.assign(new Error("Enter a phone number with country code, e.g. +919876543210."), { status: 400 });
  return value;
}
function codeHash(key, code) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${key}:${code}`).digest("hex");
}
function publicUser(user) {
  const result = user.toPublicJSON();
  // The owner must be able to see their own verified sign-in identifier.
  if (user.email && !user.email.endsWith("@phone.campusmate.invalid")) result.email = user.email;
  if (user.phone) result.phone = user.phone;
  return result;
}
router.post("/start", asyncHandler(async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter an email address or a phone number with country code." });
  let contact;
  try { contact = normalize(parsed.data.channel, parsed.data.contact); }
  catch { return res.status(400).json({ message: "Enter a valid email or phone number with country code." }); }
  if (parsed.data.channel === "email" && (process.env.EMAIL_PROVIDER !== "resend" || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) && process.env.NODE_ENV === "production") {
    return res.status(503).json({ message: "Email verification is unavailable. Please try later." });
  }
  if (parsed.data.channel === "phone" && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM)) {
    return res.status(503).json({ message: "Phone verification is unavailable. Please choose email." });
  }
  const key = `${parsed.data.channel}:${contact}`;
  const now = new Date();
  const code = String(crypto.randomInt(100000, 1000000));
  const challenge = await OtpChallenge.findOneAndUpdate(
    { key, $or: [{ cooldownUntil: { $lte: now } }, { expiresAt: { $lte: now } }] },
    { $set: { codeHash: codeHash(key, code), expiresAt: new Date(Date.now() + 10 * 60_000), cooldownUntil: new Date(Date.now() + 60_000), attempts: 0 } },
    { new: true, upsert: true, runValidators: true }
  ).catch(error => { if (error.code === 11000) return null; throw error; });
  if (!challenge) return res.status(429).json({ message: "Please wait one minute before requesting another code." });
  try {
    if (parsed.data.channel === "email") await sendEmailOtp(contact, code);
    else await sendSmsOtp(contact, code);
  } catch (error) {
    await OtpChallenge.deleteOne({ _id: challenge._id });
    throw error;
  }
  res.json({ message: "If delivery is available, a code has been sent. It expires in 10 minutes.", retryAfterSeconds: 60 });
}));
router.post("/verify", asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
  const { channel, code } = parsed.data;
  let contact;
  try { contact = normalize(channel, parsed.data.contact); }
  catch { return res.status(400).json({ message: "Invalid contact." }); }
  const key = `${channel}:${contact}`;
  const challenge = await OtpChallenge.findOneAndUpdate(
    { key, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
    { $inc: { attempts: 1 } }, { new: true }
  ).select("+codeHash");
  if (!challenge) return res.status(400).json({ message: "Code expired or too many attempts. Request a new code." });
  const supplied = codeHash(key, code);
  if (!crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(challenge.codeHash))) {
    return res.status(400).json({ message: "Incorrect code." });
  }
  const lookup = channel === "email" ? { email: contact } : { phone: contact };
  let user = await User.findOne(lookup).select("+phone");
  if (!user && (!parsed.data.name || (!parsed.data.collegeId && !parsed.data.collegeName))) {
    return res.status(400).json({ message: "For a new account, add your name and college before verifying this code." });
  }
  const claimed = await OtpChallenge.findOneAndDelete({ _id: challenge._id, attempts: challenge.attempts, codeHash: challenge.codeHash });
  if (!claimed) return res.status(400).json({ message: "Code already used. Request a new one." });
  let isNewAccount = false;
  if (!user) {
    const { name, collegeId, collegeName, collegeCity, course, branch, year } = parsed.data;
    let college = collegeId && /^[0-9a-fA-F]{24}$/.test(collegeId) ? await College.findById(collegeId) : null;
    if (!college && collegeName) {
      college = await College.findOne({ name: collegeName, city: collegeCity || "" }).collation({ locale: "en", strength: 2 });
      if (!college) college = await College.create({ name: collegeName, city: collegeCity || "", verificationStatus: "community_added" });
    }
    if (!college) return res.status(400).json({ message: "College not found. Request a new code and choose a college." });
    const email = channel === "email" ? contact : `${crypto.randomUUID()}@phone.campusmate.invalid`;
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    try {
      user = await User.create({ name, email, phone: channel === "phone" ? contact : undefined, passwordHash, college: college._id, collegeName: college.name, course, branch, year, emailType: "personal", verificationStatus: channel === "email" ? "email_verified" : "phone_verified" });
      await College.updateOne({ _id: college._id }, { $inc: { studentCount: 1 } });
      isNewAccount = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
      user = await User.findOne(lookup).select("+phone");
      if (!user) throw error;
    }
  } else if (channel === "email" && user.verificationStatus === "unverified") {
    user.verificationStatus = "email_verified";
    await user.save();
  } else if (channel === "phone" && user.verificationStatus === "unverified") {
    user.verificationStatus = "phone_verified";
    await user.save();
  }
  if (!user.isActive || user.isSuspended) return res.status(403).json({ message: "Account is unavailable." });
  user.lastActiveAt = new Date();
  await user.save();
  res.json({ token: signToken(user), user: publicUser(user), isNewAccount });
}));
module.exports = router;
