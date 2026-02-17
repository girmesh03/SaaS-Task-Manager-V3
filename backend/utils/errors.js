/**
 * @file Canonical backend error classes.
 */
import { ERROR_CODES, HTTP_STATUS } from "./constants.js";

/**
 * Base application error with canonical status and error code metadata.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {{
   *   statusCode?: number;
   *   errorCode?: string;
   *   details?: unknown;
   *   isOperational?: boolean;
   * }} [options={}] - Error metadata options.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(
    message,
    {
      statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errorCode = ERROR_CODES.INTERNAL_ERROR,
      details = null,
      isOperational = true,
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  /**
   * @param {string} [message="Validation failed"] - Error message.
   * @param {unknown} [details=null] - Validation detail payload.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "Validation failed", details = null) {
    super(message, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      details,
    });
  }
}

export class UnauthenticatedError extends AppError {
  /**
   * @param {string} [message="Authentication is required"] - Error message.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "Authentication is required") {
    super(message, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      errorCode: ERROR_CODES.UNAUTHENTICATED_ERROR,
    });
  }
}

export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message="You are not authorized to perform this action"] - Error message.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "You are not authorized to perform this action") {
    super(message, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      errorCode: ERROR_CODES.UNAUTHORIZED_ERROR,
    });
  }
}

export class NotFoundError extends AppError {
  /**
   * @param {string} [message="Resource not found"] - Error message.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "Resource not found") {
    super(message, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      errorCode: ERROR_CODES.NOT_FOUND_ERROR,
    });
  }
}

export class ConflictError extends AppError {
  /**
   * @param {string} [message="Resource conflict"] - Error message.
   * @param {unknown} [details=null] - Conflict detail payload.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "Resource conflict", details = null) {
    super(message, {
      statusCode: HTTP_STATUS.CONFLICT,
      errorCode: ERROR_CODES.CONFLICT_ERROR,
      details,
    });
  }
}

export class RateLimitedError extends AppError {
  /**
   * @param {string} [message="Too many requests. Please try again later."] - Error message.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "Too many requests. Please try again later.") {
    super(message, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      errorCode: ERROR_CODES.RATE_LIMITED_ERROR,
    });
  }
}

export class InternalError extends AppError {
  /**
   * @param {string} [message="Internal server error"] - Error message.
   * @throws {never} Constructor does not throw by design.
   */
  constructor(message = "Internal server error") {
    super(message, {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errorCode: ERROR_CODES.INTERNAL_ERROR,
      isOperational: false,
    });
  }
}
