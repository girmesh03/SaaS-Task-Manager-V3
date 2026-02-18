/**
 * @file Global Express error serialization middleware.
 */
import { AppError, InternalError } from "../utils/errors.js";
import { ERROR_CODES, HTTP_STATUS, NODE_ENVS } from "../utils/constants.js";
import logger from "../utils/logger.js";

const serializeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.name === "ValidationError") {
    return new AppError("Validation failed", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      details: error.errors,
    });
  }

  if (error?.name === "CastError") {
    return new AppError("Invalid resource identifier", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      details: [
        {
          field: error.path,
          message: error.message,
        },
      ],
    });
  }

  return new InternalError();
};

/**
 * Serializes and responds to uncaught request errors.
 *
 * @param {unknown} error - Error thrown in previous middleware/controller layers.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} _next - Express next callback (unused).
 * @returns {void} Sends JSON response and terminates middleware chain.
 * @throws {never} All errors are handled and mapped to JSON responses.
 */
export const errorHandler = (error, req, res, _next) => {
  const mapped = serializeError(error);

  logger.error("Request failed", {
    path: req.originalUrl,
    method: req.method,
    statusCode: mapped.statusCode,
    errorCode: mapped.errorCode,
    message: mapped.message,
    details: mapped.details,
    stack: process.env.NODE_ENV === NODE_ENVS.PRODUCTION ? undefined : error.stack,
  });

  res.status(mapped.statusCode).json({
    success: false,
    message: mapped.message,
    error: {
      type: mapped.errorCode,
      code: mapped.errorCode,
      statusCode: mapped.statusCode,
    },
    ...(mapped.details ? { details: mapped.details } : {}),
  });
};

export default errorHandler;
