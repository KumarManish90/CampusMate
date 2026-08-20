const mongoose = require("mongoose");

/**
 * A College is now a data record, not a hardcoded enum. Anyone can search
 * for their college at signup; if it's missing, the frontend calls
 * POST /api/colleges to add it on the fly. `verificationStatus` tracks
 * whether *the institution* has been confirmed by CampusMate staff — this
 * is intentionally separate from whether an individual *student* is
 * verified (see User.verificationStatus), so a newly-added college can be
 * used immediately without falsely implying official partnership.
 */
const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // short/display name, e.g. "GGITS" — used everywhere for matching/filtering
    fullName: { type: String, trim: true }, // optional official name, e.g. "Gyan Ganga Institute of Technology & Science"
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    domain: { type: String, trim: true, lowercase: true }, // optional, e.g. "ggits.org" — used only as a hint, never enforced
    verificationStatus: {
      type: String,
      enum: ["unverified", "community_added", "partner_verified"],
      default: "community_added",
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null for seeded/launch colleges
    studentCount: { type: Number, default: 0 }, // denormalized counter, kept in sync by User hooks/admin job
  },
  { timestamps: true }
);

// case-insensitive uniqueness on (name, city) so "GGITS" and "ggits" in the
// same city don't create duplicate rows when two students add it separately
collegeSchema.index({ name: 1, city: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
collegeSchema.index({ name: "text", city: "text" });

module.exports = mongoose.model("College", collegeSchema);
