require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const createApp = require("./app");
const connectDB = require("./config/db");
const { attachChatSocket } = require("./sockets/chat");
const { assertEmailConfig } = require("./config/email");

function validateEnv() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error(
      "[startup] JWT_SECRET is missing or shorter than 16 characters. Set a long random value in .env " +
      "(e.g. `openssl rand -hex 32`) before starting the server."
    );
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    console.warn("[startup] JWT_SECRET is valid but shorter than the recommended 32 characters; rotate it before public launch.");
  }
  if (!process.env.MONGODB_URI) {
    console.error("[startup] MONGODB_URI is required.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    const cloudinaryKeys = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
    if (process.env.MEDIA_STORAGE_MODE === "cloudinary" && cloudinaryKeys.some((key) => !process.env[key])) {
      console.warn("[startup] Cloudinary mode is selected but its credentials are incomplete; media uploads will be unavailable until they are configured.");
    } else if (process.env.MEDIA_STORAGE_MODE !== "cloudinary") {
      console.warn("[startup] Media is using local storage; files can be lost when the Render free instance restarts. Configure Cloudinary before public launch.");
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
