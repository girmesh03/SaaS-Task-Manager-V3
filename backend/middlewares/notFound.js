/**
 * @file Final not-found middleware.
 */
import { NotFoundError } from "../utils/errors.js";

/**
 * Forwards unmatched routes as canonical not-found errors.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} _res - Express response object.
 * @param {import("express").NextFunction} next - Express next callback.
 * @returns {void} Forwards not-found error through `next`.
 * @throws {never} This middleware never throws directly.
 */
export const notFound = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
};

export default notFound;
