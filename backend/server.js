require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const createApp = require("./app");
const connectDB = require("./config/db");
const { attachChatSocket } = require("./sockets/chat");
const { assertEmailConfig } = require("./config/email");

function validateEnv() {
  const minimumJwtLength = process.env.NODE_ENV === "production" ? 32 : 16;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < minimumJwtLength) {
    console.error(
      `[startup] JWT_SECRET is missing or shorter than ${minimumJwtLength} characters. Set a long random value in .env ` +
      "(e.g. `openssl rand -hex 32`) before starting the server."
    );
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("[startup] MONGODB_URI is required.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && process.env.MEDIA_STORAGE_MODE !== "cloudinary") {
    console.error("[startup] MEDIA_STORAGE_MODE must be cloudinary in production; Render local storage is ephemeral.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    const cloudinaryKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
    if (cloudinaryKeys.some((key) => !process.env[key])) {
      console.error("[startup] Cloudinary credentials are required in production.");
      process.exit(1);
    }
  }
  assertEmailConfig();
}

async function main() {
  validateEnv();
  await connectDB();

  const app = createApp(); // also validates CLIENT_URL/CORS and exits early if misconfigured in production
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: createApp.resolveAllowedOrigins(), credentials: true },
  });
  attachChatSocket(io);
  app.set("io", io); // available to any route via req.app.get("io") if needed later

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`CampusMate API listening on http://localhost:${PORT}`);
    console.log(`Media storage mode: ${process.env.MEDIA_STORAGE_MODE || "local"}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
