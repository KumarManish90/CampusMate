const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { Follow } = require("../models/Social");
const { Notification } = require("../models/Campus");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { uploadPostMedia } = require("../middleware/upload");
const { saveUploadedFile } = require("../config/media");
const { asyncHandler, paginate, scorePost } = require("../utils/helpers");

const router = express.Router();

// GET /api/feed?filter=following|GGITS|GGCT|GGCE&page=1
// Ranked, modular feed — see utils/helpers.scorePost for the formula.
router.get(
  "/feed",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { filter } = req.query;
    const { page, limit, skip } = paginate(req, 12, 30);

    const query = {};
    let followingIds = [];
    if (req.user) {
      followingIds = (await Follow.find({ follower: req.user._id }).select("following")).map((f) => f.following);
    }
    if (filter === "Following") {
      if (!req.user) return res.json({ posts: [], page, hasMore: false });
      query.author = { $in: followingIds };
    } else if (filter && filter !== "For You" && filter !== "All") {
      // Any college name is valid now (multi-college support) — not just
      // the original three launch colleges.
      query.college = filter;
    }

    // Pull a slightly larger recent window, then rank in-app (keeps ranking readable/tunable
    // without needing a separate materialized "score" field for this dataset size).
    const candidates = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("author", "name profilePhoto collegeName branch year verificationStatus interests");

    const ranked = candidates
      .map((p) => ({ post: p, score: scorePost({ ...p.toObject(), _authorInterests: p.author?.interests }, req.user, followingIds) }))
      .sort((a, b) => b.score - a.score)
      .slice(skip, skip + limit)
      .map((r) => r.post);

    res.json({ posts: ranked, page, hasMore: skip + ranked.length < candidates.length });
  })
);

// GET /api/posts/:id
router.get(
  "/posts/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).populate("author", "name profilePhoto collegeName branch year verificationStatus");
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ post });
  })
);

// POST /api/posts — multipart/form-data { media[], caption, hashtags, type, visibility }
router.post(
  "/posts",
  requireAuth,
  uploadPostMedia,
  asyncHandler(async (req, res) => {
    const { caption = "", hashtags = "", type, visibility, location } = req.body;
    const files = req.files || [];

    let media = [];
    if (type !== "text") {
      media = await Promise.all(files.map((f) => saveUploadedFile(f, "post")));
      media = media.map((m) => ({ url: m.url, publicId: m.publicId }));
    }

    const post = await Post.create({
      author: req.user._id,
      college: req.user.collegeName,
      type: type || (media.length > 1 ? "carousel" : media.length === 1 ? "photo" : "text"),
      caption,
      media,
      location,
      hashtags: String(hashtags).split(",").map((h) => h.trim()).filter(Boolean),
      visibility: visibility || req.user.privacy?.postsDefault || "campus",
    });

    res.status(201).json({ post });
  })
);

// DELETE /api/posts/:id
router.delete(
  "/posts/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (String(post.author) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted." });
  })
);

// POST /api/posts/:id/like (toggle, optimistic-UI friendly)
router.post(
  "/posts/:id/like",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const already = post.likes.some((id) => String(id) === String(req.user._id));
    if (already) {
      post.likes = post.likes.filter((id) => String(id) !== String(req.user._id));
    } else {
      post.likes.push(req.user._id);
      if (String(post.author) !== String(req.user._id)) {
        await Notification.create({ user: post.author, actor: req.user._id, type: "like_post", post: post._id });
      }
    }
    await post.save();
    res.json({ liked: !already, likesCount: post.likes.length });
  })
);

// POST /api/posts/:id/save (toggle)
router.post(
  "/posts/:id/save",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const already = post.savedBy.some((id) => String(id) === String(req.user._id));
    post.savedBy = already
      ? post.savedBy.filter((id) => String(id) !== String(req.user._id))
      : [...post.savedBy, req.user._id];
    await post.save();
    res.json({ saved: !already });
  })
);

// POST /api/posts/:id/share (increments counter; actual share sheet is a frontend concern)
router.post(
  "/posts/:id/share",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } }, { new: true });
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ sharesCount: post.sharesCount });
  })
);

module.exports = router;
