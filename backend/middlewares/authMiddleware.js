/**
 * @file Authentication middleware utilities.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { COOKIE_DEFAULTS, USER_STATUS } from "../utils/constants.js";
import {
  UnauthenticatedError,
  UnauthorizedError,
} from "../utils/errors.js";
import { normalizeId } from "../utils/helpers.js";
import { resolveEnvironment } from "../utils/env.js";

const getTokenFromRequest = (req) => {
  const env = resolveEnvironment(process.env);
  const cookieName = env.COOKIE_NAME_ACCESS || COOKIE_DEFAULTS.ACCESS_TOKEN_NAME;

  const cookieToken = req.cookies?.[cookieName];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return null;
};

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

/**
 * Requires a valid access token and attaches normalized user context to `req.user`.
 *
 * @param {import("express").Request & { user?: unknown }} req - Express request object.
 * @param {import("express").Response} _res - Express response object.
 * @param {import("express").NextFunction} next - Express next callback.
 * @returns {Promise<void>} Resolves after middleware processing.
 * @throws {never} All authentication errors are forwarded through `next`.
 */
export const requireAuth = async (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      throw new UnauthenticatedError("Authentication token is missing");
    }

    const env = resolveEnvironment(process.env);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const normalizedPayload = normalizeTokenPayload(payload);
    const record = await fetchUserContext(normalizedPayload.id);
    const normalizedUser = normalizeUserFromRecord(record, normalizedPayload);

    assertUserAuthState(normalizedUser);

    req.user = normalizedUser;
    next();
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    next(new UnauthenticatedError("Invalid or expired authentication token"));
  }
};

/**
 * Optionally resolves access token context and attaches `req.user` when present.
 *
 * @param {import("express").Request & { user?: unknown }} req - Express request object.
 * @param {import("express").Response} _res - Express response object.
 * @param {import("express").NextFunction} next - Express next callback.
 * @returns {Promise<void>} Resolves after middleware processing.
 * @throws {never} Authentication failures are swallowed and represented as `req.user = null`.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      next();
      return;
    }

    const env = resolveEnvironment(process.env);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const normalizedPayload = normalizeTokenPayload(payload);
    const record = await fetchUserContext(normalizedPayload.id);

    if (!record || record.status === USER_STATUS.INACTIVE || record.isVerified === false) {
      req.user = null;
      next();
      return;
    }

    req.user = normalizeUserFromRecord(record, normalizedPayload);
    next();
  } catch (_error) {
    req.user = null;
    next();
  }
};

export default {
  requireAuth,
  optionalAuth,
};
