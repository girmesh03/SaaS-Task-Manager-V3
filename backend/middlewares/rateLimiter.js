/**
 * @file Rate-limiter profiles for API and auth routes.
 * @throws {never} Module initialization does not throw.
 */
import rateLimit from "express-rate-limit";
import { RATE_LIMIT_PROFILES } from "../utils/constants.js";
import { RateLimitedError } from "../utils/errors.js";

const createLimiter = ({ windowMs, max }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (_req, _res, next) => {
      next(new RateLimitedError());
    },
  });
};

/**
 * Auth-route rate-limiter middleware profile.
 * @type {import("express").RequestHandler}
 */
export const authRateLimiter = createLimiter({
  windowMs: RATE_LIMIT_PROFILES.AUTH.WINDOW_MS,
  max: RATE_LIMIT_PROFILES.AUTH.MAX,
});

/**
 * General API rate-limiter middleware profile.
 * @type {import("express").RequestHandler}
 */
export const apiRateLimiter = createLimiter({
  windowMs: RATE_LIMIT_PROFILES.API.WINDOW_MS,
  max: RATE_LIMIT_PROFILES.API.MAX,
});

export default {
  authRateLimiter,
  apiRateLimiter,
};
