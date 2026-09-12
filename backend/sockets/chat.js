const jwt = require("jsonwebtoken");
const { Match, Message } = require("../models/Social");
const User = require("../models/User");

const onlineUsers = new Map(); // userId -> Set(socketId)

function attachChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("isActive isSuspended");
      if (!user?.isActive || user.isSuspended) return next(new Error("Account is not allowed to connect"));
      socket.userId = String(user._id);
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    io.emit("presence:update", { userId, online: true });

    const authorizedMatch = (matchId) => Match.findOne({ _id: matchId, users: userId, isActive: true });

    socket.on("chat:join", async (matchId, ack) => {
      try {
        const match = await authorizedMatch(matchId);
        if (!match) return ack?.({ error: "Not authorized for this conversation." });
        await socket.join(`match:${matchId}`);
        ack?.({ joined: true });
      } catch (_) {
        ack?.({ error: "Could not join conversation." });
      }
    });
    socket.on("chat:leave", (matchId) => socket.leave(`match:${matchId}`));

    socket.on("chat:typing", async ({ matchId, isTyping }) => {
      if (await authorizedMatch(matchId)) {
        socket.to(`match:${matchId}`).emit("chat:typing", { matchId, userId, isTyping: !!isTyping });
      }
    });

    socket.on("chat:message", async ({ matchId, text }, ack) => {
      try {
        if (!text?.trim()) return ack?.({ error: "Empty message." });
        const match = await Match.findById(matchId);
        if (!match?.isActive || !match.users.some((u) => String(u) === String(userId))) {
          return ack?.({ error: "Not authorized for this conversation." });
        }
        const message = await Message.create({ match: matchId, sender: userId, text: text.trim(), readBy: [userId] });
        match.lastMessageAt = new Date();
        await match.save();

        io.to(`match:${matchId}`).emit("chat:message", message);
        ack?.({ message });
      } catch (err) {
        ack?.({ error: "Could not send message." });
      }
    });

    socket.on("chat:read", async ({ matchId }) => {
      if (!(await authorizedMatch(matchId))) return;
      await Message.updateMany({ match: matchId, readBy: { $ne: userId } }, { $push: { readBy: userId } });
      socket.to(`match:${matchId}`).emit("chat:read", { matchId, userId });
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("presence:update", { userId, online: false });
        }
      }
    });
  });
}

module.exports = { attachChatSocket, onlineUsers };
