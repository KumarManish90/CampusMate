const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    college: { type: String, required: true, trim: true }, // free-text college name (multi-college, not a fixed enum)
    description: String,
    logo: { url: String, publicId: String },
    coverImage: { url: String, publicId: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDemoContent: { type: Boolean, default: false },
  },
  { timestamps: true }
);
clubSchema.virtual("membersCount").get(function () { return this.members.length; });
clubSchema.set("toJSON", { virtuals: true });

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    college: { type: String, required: true, trim: true }, // free-text college name (multi-college, not a fixed enum)
    description: String,
    image: { url: String, publicId: String },
    date: { type: Date, required: true },
    venue: String,
    organizer: String,
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    timeline: [{ time: String, label: String }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDemoContent: { type: Boolean, default: false },
  },
  { timestamps: true }
);
eventSchema.virtual("participantsCount").get(function () { return this.participants.length; });
eventSchema.set("toJSON", { virtuals: true });

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "like_post", "like_reel", "comment_post", "comment_reel", "reply_comment",
        "follow", "connection_request", "connection_accepted", "match", "share",
        "mention", "tag", "event_reminder", "club_invite",
      ],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    reel: { type: mongoose.Schema.Types.ObjectId, ref: "Reel" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ user: 1, createdAt: -1 });

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "post", "reel", "story", "comment", "message"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["Spam", "Harassment", "Fake Profile", "Inappropriate Content", "Copyright", "Impersonation", "Other"],
      required: true,
    },
    details: String,
    status: { type: String, enum: ["pending", "reviewed", "actioned", "dismissed"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = {
  Club: mongoose.model("Club", clubSchema),
  Event: mongoose.model("Event", eventSchema),
  Notification: mongoose.model("Notification", notificationSchema),
  Report: mongoose.model("Report", reportSchema),
};
