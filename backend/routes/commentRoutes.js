const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Reel = require("../models/Reel");
const { Notification } = require("../models/Campus");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

const MODEL_BY_TYPE = { post: Post, reel: Reel };
const NOTIF_BY_TYPE = { post: "comment_post", reel: "comment_reel" };

// GET /api/:type/:id/comments  (mounted twice below for /posts and /reels)
function listComments(targetTypeModel) {
  return asyncHandler(async (req, res) => {
    const comments = await Comment.find({ target: req.params.id, targetTypeModel, isDeleted: false })
      .sort({ createdAt: 1 })
      .limit(500)
      .populate("author", "name profilePhoto collegeName");
    res.json({ comments });
  });
}

function addComment(targetType, targetTypeModel) {
  return asyncHandler(async (req, res) => {
    const { text, parentComment } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text is required." });

    const TargetModel = MODEL_BY_TYPE[targetType];
    const target = await TargetModel.findById(req.params.id);
    if (!target) return res.status(404).json({ message: `${targetType} not found.` });

    const comment = await Comment.create({
      author: req.user._id,
      targetType,
      target: target._id,
      targetTypeModel,
      parentComment: parentComment || null,
      text: text.trim(),
    });

    target.commentsCount += 1;
    await target.save();

    if (String(target.author) !== String(req.user._id)) {
      await Notification.create({
        user: target.author,
        actor: req.user._id,
        type: parentComment ? "reply_comment" : NOTIF_BY_TYPE[targetType],
        [targetType]: target._id,
        comment: comment._id,
      });
    }

    const populated = await comment.populate("author", "name profilePhoto collegeName");
    res.status(201).json({ comment: populated });
  });
}

router.get("/posts/:id/comments", listComments("Post"));
router.post("/posts/:id/comments", requireAuth, addComment("post", "Post"));
router.get("/reels/:id/comments", listComments("Reel"));
router.post("/reels/:id/comments", requireAuth, addComment("reel", "Reel"));

router.post(
  "/comments/:id/like",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    const already = comment.likes.some((id) => String(id) === String(req.user._id));
    comment.likes = already
      ? comment.likes.filter((id) => String(id) !== String(req.user._id))
      : [...comment.likes, req.user._id];
    await comment.save();
    res.json({ liked: !already, likesCount: comment.likes.length });
  })
);

router.post(
  "/comments/:id/reply",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parent = await Comment.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: "Comment not found." });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Reply text is required." });

    const reply = await Comment.create({
      author: req.user._id,
      targetType: parent.targetType,
      target: parent.target,
      targetTypeModel: parent.targetTypeModel,
      parentComment: parent._id,
      text: text.trim(),
    });

    const TargetModel = MODEL_BY_TYPE[parent.targetType];
    await TargetModel.updateOne({ _id: parent.target }, { $inc: { commentsCount: 1 } });

    res.status(201).json({ comment: await reply.populate("author", "name profilePhoto collegeName") });
  })
);

router.delete(
  "/comments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    if (String(comment.author) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }
    comment.isDeleted = true;
    comment.text = "[deleted]";
    await comment.save();

    const TargetModel = MODEL_BY_TYPE[comment.targetType];
    await TargetModel.updateOne({ _id: comment.target }, { $inc: { commentsCount: -1 } });

    res.json({ message: "Comment deleted." });
  })
);

module.exports = router;
