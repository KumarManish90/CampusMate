/**
 * Socket.IO client. Connect after login (once a JWT is in localStorage):
 *
 *   import { connectSocket } from "./socket";
 *   const socket = connectSocket();
 *   socket.emit("chat:join", matchId);
 *   socket.on("chat:message", (msg) => { ... });
 *   socket.emit("chat:message", { matchId, text }, (ack) => { ... });
 *   socket.emit("chat:typing", { matchId, isTyping: true });
 *
 * Mirrors the event names implemented in backend/sockets/chat.js.
 */
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://campusmate-87k6.onrender.com";

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("cm_token");
  if (!token) throw new Error("connectSocket() called before login — no JWT in localStorage.");

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
