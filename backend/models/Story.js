const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    college: { type: String, required: true, trim: true }, // free-text college name (multi-college, not a fixed enum)
    type: { type: String, enum: ["image", "video", "text"], required: true },
    mediaUrl: String,
    mediaPublicId: String,
    textOverlay: String,
    backgroundColor: String, // used for text-only stories
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index -> Mongo auto-deletes
    isDemoContent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

storySchema.statics.defaultExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

module.exports = mongoose.model("Story", storySchema);
