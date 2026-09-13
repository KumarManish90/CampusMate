import { io } from "socket.io-client";
import { API_ORIGIN } from "./client";

let socket;

export function getChatSocket() {
  const token = localStorage.getItem("cm_token");
  if (!token) return null;
  if (!socket) {
    socket = io(API_ORIGIN, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 8,
    });
  } else if (socket.auth?.token !== token) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
  return socket;
}

export function disconnectChatSocket() {
  if (socket) socket.disconnect();
  socket = undefined;
}
