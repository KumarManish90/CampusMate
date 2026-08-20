const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const Reel = require("../models/Reel");
const { Follow, Connection } = require("../models/Social");
const { Notification } = require("../models/Campus");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { uploadProfilePhoto } = require("../middleware/upload");
const { saveUploadedFile } = require("../config/media");
const { asyncHandler, paginate } = require("../utils/helpers");

const router = express.Router();

// GET /api/users?college=GGITS&q=rahul
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { college, q } = req.query;
    const { page, limit, skip } = paginate(req);
    const filter = {};
    if (college && college !== "All") filter.collegeName = college;
    if (q) filter.$text = { $search: q };

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ users: users.map((u) => u.toPublicJSON()), page, total, hasMore: skip + users.length < total });
  })
);

// GET /api/users/:id
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    let isFollowing = false;
    let connectionStatus = null;
    if (req.user) {
      isFollowing = !!(await Follow.findOne({ follower: req.user._id, following: user._id }));
      const conn = await Connection.findOne({
        $or: [
          { requester: req.user._id, recipient: user._id },
          { requester: user._id, recipient: req.user._id },
        ],
      });
      connectionStatus = conn?.status || null;
    }

    res.json({ user: user.toPublicJSON(), isFollowing, connectionStatus });
  })
);

// PUT /api/users/:id
router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (String(req.user._id) !== req.params.id) return res.status(403).json({ message: "You can only edit your own profile." });

    const allowed = ["name", "bio", "branch", "year", "section", "interests", "skills", "hobbies", "lookingFor", "privacy"];
    for (const key of allowed) if (key in req.body) req.user[key] = req.body[key];
    await req.user.save();

    res.json({ user: req.user.toPublicJSON() });
  })
);

// POST /api/users/:id/photo — multipart/form-data { photo }
router.post(
  "/:id/photo",
  requireAuth,
  uploadProfilePhoto,
  asyncHandler(async (req, res) => {
    if (String(req.user._id) !== req.params.id) return res.status(403).json({ message: "You can only edit your own photo." });
    if (!req.file) return res.status(400).json({ message: "No image was uploaded." });

    const saved = await saveUploadedFile(req.file, "profile");
    req.user.profilePhoto = { url: saved.url, publicId: saved.publicId };
    await req.user.save();

    res.json({ user: req.user.toPublicJSON(), message: "Profile photo updated successfully." });
  })
);

// DELETE /api/users/:id/photo
router.delete(
  "/:id/photo",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (String(req.user._id) !== req.params.id) return res.status(403).json({ message: "You can only edit your own photo." });
    req.user.profilePhoto = undefined;
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  })
);

// GET /api/users/:id/posts | /reels | /saved
router.get(
  "/:id/posts",
  asyncHandler(async (req, res) => {
    const posts = await Post.find({ author: req.params.id }).sort({ createdAt: -1 }).limit(60);
    res.json({ posts });
  })
);
router.get(
  "/:id/reels",
  asyncHandler(async (req, res) => {
    const reels = await Reel.find({ author: req.params.id }).sort({ createdAt: -1 }).limit(60);
    res.json({ reels });
  })
);
router.get(
  "/:id/saved",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (String(req.user._id) !== req.params.id) return res.status(403).json({ message: "Saved content is private." });
    const [posts, reels] = await Promise.all([
      Post.find({ savedBy: req.user._id }).sort({ createdAt: -1 }),
      Reel.find({ savedBy: req.user._id }).sort({ createdAt: -1 }),
    ]);
    res.json({ posts, reels });
  })
);

// POST/DELETE /api/users/:id/follow
router.post(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (String(req.user._id) === req.params.id) return res.status(400).json({ message: "You can't follow yourself." });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });

    await Follow.findOneAndUpdate(
      { follower: req.user._id, following: target._id },
      { follower: req.user._id, following: target._id },
      { upsert: true }
    );
    await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: 1 } });
    await User.updateOne({ _id: target._id }, { $inc: { followersCount: 1 } });
    await Notification.create({ user: target._id, actor: req.user._id, type: "follow" });

    res.json({ isFollowing: true });
  })
);

router.delete(
  "/:id/follow",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await Follow.findOneAndDelete({ follower: req.user._id, following: req.params.id });
    if (result) {
      await User.updateOne({ _id: req.user._id }, { $inc: { followingCount: -1 } });
      await User.updateOne({ _id: req.params.id }, { $inc: { followersCount: -1 } });
    }
    res.json({ isFollowing: false });
  })
);

module.exports = router;
