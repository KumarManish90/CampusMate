const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const Reel = require("../models/Reel");
const Comment = require("../models/Comment");
const { Match, Message } = require("../models/Social");
const { Club, Event, Notification, Report } = require("../models/Campus");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { asyncHandler } = require("../utils/helpers");
const { deleteStoredFiles } = require("../config/media");

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats — powers the admin dashboard charts
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    // Dynamic — reflects however many colleges have actually signed up
    // students, rather than assuming the original launch set of three.
    const colleges = (await User.distinct("collegeName")).sort();

    const [totalStudents, studentsByCollege, totalPosts, postsByCollege, totalReels, reelsByCollege, totalMatches, totalMessages, totalReports, pendingReports] =
      await Promise.all([
        User.countDocuments(),
        Promise.all(colleges.map((c) => User.countDocuments({ collegeName: c }))),
        Post.countDocuments(),
        Promise.all(colleges.map((c) => Post.countDocuments({ college: c }))),
        Reel.countDocuments(),
        Promise.all(colleges.map((c) => Reel.countDocuments({ college: c }))),
        Match.countDocuments({ isActive: true }),
        Message.countDocuments(),
        Report.countDocuments(),
        Report.countDocuments({ status: "pending" }),
      ]);

    // popular hashtags (top 8 across posts)
    const hashtagAgg = await Post.aggregate([
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      totals: { totalStudents, totalPosts, totalReels, totalMatches, totalMessages, totalReports, pendingReports },
      byCollege: colleges.map((c, i) => ({
        college: c,
        students: studentsByCollege[i],
        posts: postsByCollege[i],
        reels: reelsByCollege[i],
      })),
      popularHashtags: hashtagAgg.map((h) => ({ tag: h._id, count: h.count })),
    });
  })
);

// GET /api/admin/reports
router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const reports = await Report.find({}).sort({ createdAt: -1 }).limit(100).populate("reporter", "name collegeName");
    res.json({ reports });
  })
);

router.post(
  "/reports/:id/resolve",
  asyncHandler(async (req, res) => {
    const { status } = req.body; // "reviewed" | "actioned" | "dismissed"
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user._id },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.json({ report });
  })
);

router.delete("/posts/:id", asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found." });
  await Promise.all([
    deleteStoredFiles(post.media),
    Comment.deleteMany({ target: post._id, targetType: "post" }),
    Notification.deleteMany({ post: post._id }),
  ]);
  await post.deleteOne();
  res.json({ message: "Post removed by admin." });
}));

router.delete("/reels/:id", asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  if (!reel) return res.status(404).json({ message: "Reel not found." });
  await Promise.all([
    deleteStoredFiles([
      { url: reel.videoUrl, publicId: reel.videoPublicId },
      reel.thumbnailPublicId ? { url: reel.thumbnailUrl, publicId: reel.thumbnailPublicId } : null,
    ]),
    Comment.deleteMany({ target: reel._id, targetType: "reel" }),
    Notification.deleteMany({ reel: reel._id }),
  ]);
  await reel.deleteOne();
  res.json({ message: "Reel removed by admin." });
}));

router.delete("/comments/:id", asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found." });
  if (!comment.isDeleted) {
    comment.isDeleted = true;
    comment.text = "[removed by admin]";
    await Promise.all([
      comment.save(),
      (comment.targetType === "post" ? Post : Reel).updateOne(
        { _id: comment.target, commentsCount: { $gt: 0 } },
        { $inc: { commentsCount: -1 } }
      ),
    ]);
  }
  res.json({ message: "Comment removed by admin." });
}));

router.post("/users/:id/suspend", asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: user.toPublicJSON() });
}));

router.post("/users/:id/unsuspend", asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: user.toPublicJSON() });
}));

module.exports = router;
