const jwt = require("jsonwebtoken");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function paginate(req, defaultLimit = 20, maxLimit = 50) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Modular, explainable feed-ranking score — not a black box.
 * feedScore = recency + engagement + interestSimilarity + connectionStrength + collegeRelevance
 * Each term is capped so no single factor can dominate the ranking.
 */
function scorePost(post, viewer, followingIds = []) {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 36e5;
  const recency = Math.max(0, 48 - ageHours) * 2; // decays to 0 after 48h

  const engagement = Math.min(60, (post.likes?.length || 0) * 1 + (post.commentsCount || 0) * 2 + (post.sharesCount || 0) * 3);

  const interestSimilarity = viewer?.interests?.length
    ? Math.min(20, (post._authorInterests || []).filter((i) => viewer.interests.includes(i)).length * 5)
    : 0;

  const connectionStrength = followingIds.some((id) => String(id) === String(post.author?._id || post.author))
    ? 25
    : 0;

  const collegeRelevance = viewer && post.college === viewer.collegeName ? 15 : 5;

  return recency + engagement + interestSimilarity + connectionStrength + collegeRelevance;
}

module.exports = { asyncHandler, signToken, paginate, scorePost };
