const mongoose = require("mongoose");

const reelSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    college: { type: String, required: true, trim: true, index: true }, // free-text college name (multi-college, not a fixed enum)

    videoUrl: { type: String, required: true },
    videoPublicId: String,
    thumbnailUrl: { type: String, required: true },
    thumbnailPublicId: String,
    duration: { type: Number, required: true }, // seconds

    caption: { type: String, maxlength: 300, default: "" },
    audioName: { type: String, default: "Original Audio" },
    hashtags: [{ type: String, index: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    // users who have already registered a "meaningful watch" view,
    // so refreshes/re-scrolls don't inflate the count
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    visibility: { type: String, enum: ["public", "campus", "college", "connections", "private"], default: "campus" },
    isDemoContent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reelSchema.virtual("likesCount").get(function () { return this.likes.length; });
reelSchema.virtual("savesCount").get(function () { return this.savedBy.length; });
reelSchema.set("toJSON", { virtuals: true });

reelSchema.index({ createdAt: -1 });
reelSchema.index({ viewsCount: -1 });

module.exports = mongoose.model("Reel", reelSchema);
