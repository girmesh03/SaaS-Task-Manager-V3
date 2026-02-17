/**
 * @file Authentication middleware utilities.
 */
import jwt from "jsonwebtoken";
import { COOKIE_DEFAULTS } from "../utils/constants.js";
import { UnauthenticatedError } from "../utils/errors.js";
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

const normalizeUser = (payload = {}) => {
  return {
    id: normalizeId(payload.sub || payload.userId || payload.id),
    role: payload.role || null,
    organization: normalizeId(payload.organization || payload.orgId || null),
    department: normalizeId(payload.department || payload.departmentId || null),
    isPlatformOrgUser: Boolean(payload.isPlatformOrgUser),
    isHod: Boolean(payload.isHod),
  };
};

/**
 * Requires a valid access token and attaches normalized user context to `req.user`.
 *
 * @param {import("express").Request & { user?: unknown }} req - Express request object.
 * @param {import("express").Response} _res - Express response object.
 * @param {import("express").NextFunction} next - Express next callback.
 * @returns {void} Returns void and forwards control through `next`.
 * @throws {never} All authentication errors are forwarded through `next`.
 */
export const requireAuth = (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      throw new UnauthenticatedError("Authentication token is missing");
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = normalizeUser(payload);
    next();
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
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
 * @returns {void} Returns void and always forwards control through `next`.
 * @throws {never} Authentication failures are swallowed and represented as `req.user = null`.
 */
export const optionalAuth = (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      next();
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = normalizeUser(payload);
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
