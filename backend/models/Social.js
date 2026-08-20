/**
 * Follow / Connection / Match are kept intentionally distinct (per product spec):
 *   - Follow:     one-directional, powers the social feed ("Following" filter)
 *   - Connection: bidirectional networking request/accept, for teammates/friends
 *   - Match:      mutual swipe-like from the Discovery feature, opens a Chat
 */
const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const connectionSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    context: { type: String, enum: ["friends", "study_partner", "project_partner", "hackathon_team", "networking"], default: "networking" },
  },
  { timestamps: true }
);
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const matchSchema = new mongoose.Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }], // always length 2
    lastMessageAt: Date,
    isActive: { type: Boolean, default: true }, // false after unmatch
  },
  { timestamps: true }
);
matchSchema.index({ users: 1 });

const swipeSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["like", "pass", "super_like"], required: true },
  },
  { timestamps: true }
);
swipeSchema.index({ from: 1, to: 1 }, { unique: true });

const messageSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, maxlength: 2000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
// Matches the actual query shape (find by match, sorted by recency) used by
// GET /api/messages/:matchId — a single-field index on `match` alone would
// still require an in-memory sort for every page.
messageSchema.index({ match: 1, createdAt: -1 });

module.exports = {
  Follow: mongoose.model("Follow", followSchema),
  Connection: mongoose.model("Connection", connectionSchema),
  Match: mongoose.model("Match", matchSchema),
  Swipe: mongoose.model("Swipe", swipeSchema),
  Message: mongoose.model("Message", messageSchema),
};
