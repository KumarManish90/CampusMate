const mongoose = require("mongoose");

// These remain as *suggestions* for the UI's autocomplete/dropdowns, not
// hard schema constraints — a student at a college we've never seen a
// branch name from before shouldn't be blocked from registering.
const SUGGESTED_BRANCHES = ["CSE", "CSE-DS", "CSE-AIML", "IT", "ECE", "EE", "Mechanical", "Civil", "Other"];
const LOOKING_FOR = ["Friends", "Study Partner", "Project Partner", "Hackathon Team", "Networking", "Club", "Events", "Dating"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // "college" = signed up with an institutional-looking address matched against
    // College.domain; "personal" = gmail/outlook/etc. Neither is required or
    // blocked — this is informational only, per the "college email must not be
    // mandatory" requirement.
    emailType: { type: String, enum: ["college", "personal"], default: "personal" },
    passwordHash: { type: String, required: true, select: false },

    profilePhoto: { url: String, publicId: String },
    coverPhoto: { url: String, publicId: String },

    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"], default: "prefer_not_to_say" },
    bio: { type: String, maxlength: 160, default: "" },

    // College is now a reference into the College collection (see models/College.js),
    // not a hardcoded enum — this is the core of multi-college support. `collegeName`
    // is a denormalized cache of College.name so the UI never has to join just to
    // render a badge; it's kept in sync whenever `college` is set.
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    collegeName: { type: String, required: true, trim: true },

    course: { type: String, trim: true }, // e.g. "B.Tech", "BCA", "M.Sc" — free text, not enum
    branch: { type: String, trim: true }, // free text; SUGGESTED_BRANCHES powers autocomplete only
    year: { type: String, enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"] },
    section: String,

    interests: [{ type: String }],
    skills: [{ type: String }],
    hobbies: [{ type: String }],
    lookingFor: { type: String, enum: LOOKING_FOR },

    // Verification is now a real progression rather than a single boolean:
    //   unverified       -> just registered
    //   email_verified   -> confirmed the OTP sent to their email (college or personal)
    //   college_verified -> additionally confirmed as an actual student of `college`
    //                       (e.g. matched an institutional email domain, or manual review)
    // Entering a college name at signup NEVER by itself implies college_verified.
    verificationStatus: { type: String, enum: ["unverified", "email_verified", "college_verified"], default: "unverified" },
    emailOtpHash: { type: String, select: false },
    emailOtpExpiresAt: { type: Date, select: false },
    isDemoAccount: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },

    privacy: {
      postsDefault: { type: String, enum: ["public", "campus", "college", "connections", "private"], default: "campus" },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
    },
    phone: { type: String, select: false }, // never returned unless privacy.showPhone

    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    connectionsCount: { type: Number, default: 0 },

    lastActiveAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ college: 1 });
userSchema.index({ name: "text", bio: "text" });

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.emailOtpHash;
  delete obj.emailOtpExpiresAt;
  if (!obj.privacy?.showEmail) delete obj.email;
  if (!obj.privacy?.showPhone) delete obj.phone;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
module.exports.SUGGESTED_BRANCHES = SUGGESTED_BRANCHES;
module.exports.LOOKING_FOR = LOOKING_FOR;
