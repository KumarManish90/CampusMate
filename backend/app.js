const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

const { notFound, errorHandler } = require("./middleware/errorHandler");
const responseEnvelope = require("./middleware/responseEnvelope");

const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes"); // also exposes GET /api/feed
const reelRoutes = require("./routes/reelRoutes");
const storyRoutes = require("./routes/storyRoutes");
const commentRoutes = require("./routes/commentRoutes");
const matchRoutes = require("./routes/matchRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const clubRoutes = require("./routes/clubRoutes");
const eventRoutes = require("./routes/eventRoutes");
const miscRoutes = require("./routes/miscRoutes"); // notifications, search, hashtags, reports
const adminRoutes = require("./routes/adminRoutes");

/**
 * Resolves allowed CORS origins from CLIENT_URL (comma-separated for
 * multiple environments, e.g. a Vercel preview + production domain).
 * Deliberately never falls back to "*" — wildcard origin + credentials:true
 * is both rejected by browsers and a real security footgun, so a missing
 * CLIENT_URL fails loudly in production and only defaults to the local Vite
 * dev server outside production.
 */
function resolveAllowedOrigins() {
  const configured = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (configured.length > 0) return configured;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[cors] CLIENT_URL is not set. Refusing to start with an open CORS policy in production — " +
      "set CLIENT_URL to your deployed frontend origin(s), comma-separated if more than one."
    );
    process.exit(1);
  }

  console.warn("[cors] CLIENT_URL not set — defaulting to http://localhost:5173 for local development only.");
  return ["http://localhost:5173"];
}

function createApp() {
  const app = express();
  const allowedOrigins = resolveAllowedOrigins();

  app.use(helmet({ crossOriginResourcePolicy: false })); // allow /uploads media to be embedded cross-origin
  app.use(cors({
    origin: (origin, callback) => {
      // allow same-origin/non-browser requests (no Origin header, e.g. curl, health checks)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use(responseEnvelope);
  if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") app.use(morgan("dev"));
  if (process.env.NODE_ENV === "production") app.use(morgan("combined")); // no request bodies/headers, safe for prod logs

  const limiter = rateLimit({
    windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // Tighter limit specifically on login/register to slow down credential
  // stuffing / brute-force attempts without affecting normal browsing.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please wait a few minutes and try again." },
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // Local-mode media (no-op in production if you're on Cloudinary)
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.get("/api/health", (req, res) => res.json({ message: "CampusMate API is running", time: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/colleges", collegeRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api", postRoutes); // /api/feed, /api/posts/*
  app.use("/api/reels", reelRoutes);
  app.use("/api/stories", storyRoutes);
  app.use("/api", commentRoutes); // /api/posts/:id/comments, /api/reels/:id/comments, /api/comments/*
  app.use("/api", matchRoutes); // /api/discover, /api/swipes, /api/matches
  app.use("/api/connections", connectionRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/clubs", clubRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api", miscRoutes); // /api/notifications, /api/search, /api/hashtags/:tag, /api/reports
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
module.exports.resolveAllowedOrigins = resolveAllowedOrigins;
