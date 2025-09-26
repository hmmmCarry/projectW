import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:8080";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    console.log("Creating new socket connection to:", SOCKET_URL);
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      withCredentials: false,
    });
    
    socket.on("connect", () => {
      console.log("Socket connected successfully, ID:", socket?.id);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type { Socket };

