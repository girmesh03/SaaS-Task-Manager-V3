/**
 * @file Socket service with cookie-based auth (Phase 4).
 */
import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { COOKIE_DEFAULTS, USER_ROLES, USER_STATUS } from "../utils/constants.js";
import { UnauthenticatedError, UnauthorizedError } from "../utils/errors.js";
import { normalizeId } from "../utils/helpers.js";
import { resolveEnvironment } from "../utils/env.js";
import logger from "../utils/logger.js";

let io = null;

const isPlatformSuperAdmin = (user) =>
  user?.role === USER_ROLES.SUPER_ADMIN && Boolean(user?.isPlatformOrgUser);

const normalizeTokenPayload = (payload = {}) => {
  return {
    id: normalizeId(payload.sub || payload.userId || payload.id),
    role: payload.role || null,
    organization: normalizeId(payload.organization || payload.orgId || null),
    department: normalizeId(payload.department || payload.departmentId || null),
    isPlatformOrgUser: Boolean(payload.isPlatformOrgUser),
    isHod: Boolean(payload.isHod),
  };
};

const normalizeUserFromRecord = (record, fallbackPayload = {}) => {
  return {
    id: normalizeId(record?._id || fallbackPayload.id),
    role: record?.role || fallbackPayload.role || null,
    organization: normalizeId(record?.organization || fallbackPayload.organization),
    department: normalizeId(record?.department || fallbackPayload.department),
    isPlatformOrgUser:
      typeof record?.isPlatformOrgUser === "boolean"
        ? record.isPlatformOrgUser
        : Boolean(fallbackPayload.isPlatformOrgUser),
    isHod:
      typeof record?.isHod === "boolean" ? record.isHod : Boolean(fallbackPayload.isHod),
    status: record?.status || null,
    isVerified:
      typeof record?.isVerified === "boolean" ? record.isVerified : undefined,
  };
};

const fetchUserContext = async (userId) => {
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId)
    .withDeleted()
    .select("_id role organization department isPlatformOrgUser isHod status isVerified isDeleted");

  if (!user || user.isDeleted) {
    return null;
  }

  return user;
};

const assertUserAuthState = (user) => {
  if (!user) {
    throw new UnauthenticatedError("Authenticated user was not found");
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw new UnauthorizedError("Account is inactive");
  }

  if (user.isVerified === false) {
    throw new UnauthorizedError("Account is not verified");
  }
};

const getTokenFromHandshake = (socket) => {
  const env = resolveEnvironment(process.env);
  const cookieName = env.COOKIE_NAME_ACCESS || COOKIE_DEFAULTS.ACCESS_TOKEN_NAME;

  const cookieHeader = socket.handshake?.headers?.cookie || "";
  const parsedCookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const cookieToken = parsedCookies?.[cookieName];

  return cookieToken || socket.handshake?.auth?.token || null;
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
    (async () => {
      try {
        const token = getTokenFromHandshake(socket);
        if (!token) {
          throw new UnauthenticatedError("Socket authentication token is missing");
        }

        const payload = jwt.verify(token, jwtSecret);
        const normalizedPayload = normalizeTokenPayload(payload);

        const record = await fetchUserContext(normalizedPayload.id);
        const normalizedUser = normalizeUserFromRecord(record, normalizedPayload);

        assertUserAuthState(normalizedUser);

        if (!normalizedUser.id || !normalizedUser.organization || !normalizedUser.department) {
          throw new UnauthenticatedError("Socket authentication payload is incomplete");
        }

        socket.user = normalizedUser;
        next();
      } catch (error) {
        next(new Error(`Socket authentication failed: ${error.message}`));
      }
    })();
  });

  io.on("connection", (socket) => {
    const user = socket.user || {};

    socket.join(`user:${user.id}`);
    socket.join(`org:${user.organization}`);
    socket.join(`dept:${user.department}`);

    socket.on("join:task", async ({ taskId }) => {
      try {
        if (!taskId) {
          return;
        }

        if (isPlatformSuperAdmin(user)) {
          socket.join(`task:${taskId}`);
          return;
        }

        const task = await Task.findById(taskId)
          .withDeleted()
          .select("organization department");

        if (!task) {
          return;
        }

        const sameOrg = normalizeId(task.organization) === normalizeId(user.organization);
        const sameDept = normalizeId(task.department) === normalizeId(user.department);

        if (!sameOrg || !sameDept) {
          return;
        }

        socket.join(`task:${taskId}`);
      } catch (_error) {
        // swallow join guard failures
      }
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
