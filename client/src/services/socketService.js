/**
 * @file Socket service wrapper for Phase 4 realtime updates.
 * @throws {never} Module initialization does not throw.
 */

import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

  try {
    return new URL(baseUrl).origin;
  } catch {
    return String(baseUrl).replace(/\/api\/?$/, "");
  }
};

let socket = null;

const ensureSocket = () => {
  if (socket) {
    return socket;
  }

  socket = io(resolveSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket"],
  });

  return socket;
};

/**
 * Socket service API.
 *
 * @type {{
 *   connect: () => import("socket.io-client").Socket;
 *   disconnect: () => void;
 *   getSocket: () => import("socket.io-client").Socket | null;
 *   isConnected: () => boolean;
 * }}
 */
export const socketService = {
  connect: () => {
    const instance = ensureSocket();
    if (!instance.connected) {
      instance.connect();
    }
    return instance;
  },
  disconnect: () => {
    if (!socket) {
      return;
    }
    socket.disconnect();
  },
  getSocket: () => socket,
  isConnected: () => Boolean(socket?.connected),
};

export default socketService;
