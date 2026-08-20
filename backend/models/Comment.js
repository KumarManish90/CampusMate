const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["post", "reel"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetTypeModel" },
    targetTypeModel: { type: String, enum: ["Post", "Reel"], required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // set -> this is a reply
    text: { type: String, required: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ target: 1, createdAt: -1 });
commentSchema.virtual("likesCount").get(function () { return this.likes.length; });
commentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Comment", commentSchema);
