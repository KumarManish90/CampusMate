const jwt = require("jsonwebtoken");
const { Match, Message } = require("../models/Social");

const onlineUsers = new Map(); // userId -> Set(socketId)

function attachChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
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

    socket.on("chat:join", (matchId) => socket.join(`match:${matchId}`));
    socket.on("chat:leave", (matchId) => socket.leave(`match:${matchId}`));

    socket.on("chat:typing", ({ matchId, isTyping }) => {
      socket.to(`match:${matchId}`).emit("chat:typing", { matchId, userId, isTyping });
    });

    socket.on("chat:message", async ({ matchId, text }, ack) => {
      try {
        if (!text?.trim()) return ack?.({ error: "Empty message." });
        const match = await Match.findById(matchId);
        if (!match || !match.users.some((u) => String(u) === String(userId))) {
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
