/**
 * @file Socket service scaffold for phase 2.
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

let io = null;

const normalizeSocketUser = (payload = {}) => {
  return {
    id: payload.sub || payload.userId || payload.id || null,
    organization: payload.organization || payload.orgId || null,
    department: payload.department || payload.departmentId || null,
    role: payload.role || null,
    isPlatformOrgUser: Boolean(payload.isPlatformOrgUser),
    isHod: Boolean(payload.isHod),
  };
};

/**
 * Initializes Socket.IO server integration.
 *
 * @param {import("http").Server} server - HTTP server instance.
 * @param {{ jwtSecret: string; corsOrigin?: string | string[] }} options - Socket options.
 * @returns {Server | null} Socket.IO server instance when initialized.
 * @throws {Error} Throws when required options are invalid.
 */
export const initializeSocketService = (server, { jwtSecret, corsOrigin = "*" }) => {
  if (!server) {
    return null;
  }

  if (!jwtSecret) {
    throw new Error("Socket service requires a JWT secret");
  }

  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token || null;
      if (!token) {
        next(new Error("Socket authentication token is missing"));
        return;
      }

      const payload = jwt.verify(token, jwtSecret);
      socket.user = normalizeSocketUser(payload);

      if (!socket.user.id || !socket.user.organization || !socket.user.department) {
        next(new Error("Socket authentication payload is incomplete"));
        return;
      }

      next();
    } catch (error) {
      next(new Error(`Socket authentication failed: ${error.message}`));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user || {};

    socket.join(`user:${user.id}`);
    socket.join(`org:${user.organization}`);
    socket.join(`dept:${user.department}`);

    socket.on("join:task", ({ taskId }) => {
      if (!taskId) {
        return;
      }

      socket.join(`task:${taskId}`);
    });

    socket.on("leave:task", ({ taskId }) => {
      if (!taskId) {
        return;
      }

      socket.leave(`task:${taskId}`);
    });
  });

  logger.info("Socket service initialized");
  return io;
};

/**
 * Returns current socket server instance.
 *
 * @returns {Server | null} Socket.IO server instance or null.
 * @throws {never} This helper does not throw.
 */
export const getSocketService = () => io;

/**
 * Emits event to a user room.
 *
 * @param {{ userId: string; event: string; payload: unknown }} options - Emission options.
 * @returns {void} Emits when socket service is active.
 * @throws {never} This helper does not throw.
 */
export const emitToUser = ({ userId, event, payload }) => {
  if (!io || !userId || !event) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
};

/**
 * Emits event to an organization room.
 *
 * @param {{ organizationId: string; event: string; payload: unknown }} options - Emission options.
 * @returns {void} Emits when socket service is active.
 * @throws {never} This helper does not throw.
 */
export const emitToOrganization = ({ organizationId, event, payload }) => {
  if (!io || !organizationId || !event) {
    return;
  }

  io.to(`org:${organizationId}`).emit(event, payload);
};

/**
 * Emits event to a department room.
 *
 * @param {{ departmentId: string; event: string; payload: unknown }} options - Emission options.
 * @returns {void} Emits when socket service is active.
 * @throws {never} This helper does not throw.
 */
export const emitToDepartment = ({ departmentId, event, payload }) => {
  if (!io || !departmentId || !event) {
    return;
  }

  io.to(`dept:${departmentId}`).emit(event, payload);
};

/**
 * Emits event to a task room.
 *
 * @param {{ taskId: string; event: string; payload: unknown }} options - Emission options.
 * @returns {void} Emits when socket service is active.
 * @throws {never} This helper does not throw.
 */
export const emitToTask = ({ taskId, event, payload }) => {
  if (!io || !taskId || !event) {
    return;
  }

  io.to(`task:${taskId}`).emit(event, payload);
};

/**
 * Closes socket server and releases singleton reference.
 *
 * @returns {Promise<void>} Resolves when close operation completes.
 * @throws {never} Close failures are swallowed to preserve graceful shutdown flow.
 */
export const closeSocketService = async () => {
  if (!io) {
    return;
  }

  try {
    await io.close();
  } catch (_error) {
    // no-op during shutdown
  } finally {
    io = null;
  }
};

export default {
  initializeSocketService,
  getSocketService,
  emitToUser,
  emitToOrganization,
  emitToDepartment,
  emitToTask,
  closeSocketService,
};
