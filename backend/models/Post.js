const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  { url: String, publicId: String, width: Number, height: Number, aspect: String },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    college: { type: String, required: true, trim: true, index: true }, // free-text college name (multi-college, not a fixed enum)
    type: { type: String, enum: ["photo", "carousel", "text", "event", "club"], required: true },

    caption: { type: String, maxlength: 500, default: "" },
    media: [mediaSchema], // empty for text posts
    thumbnail: mediaSchema,

    location: String,
    hashtags: [{ type: String, index: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },

    visibility: { type: String, enum: ["public", "campus", "college", "connections", "private"], default: "campus" },
    isDemoContent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.virtual("likesCount").get(function () { return this.likes.length; });
postSchema.virtual("savesCount").get(function () { return this.savedBy.length; });
postSchema.set("toJSON", { virtuals: true });

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
