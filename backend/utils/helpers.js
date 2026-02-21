/**
 * @file Shared helper utilities for pagination, ids, and response shape.
 */
import mongoose from "mongoose";
import { PAGINATION_DEFAULTS } from "./constants.js";

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes"].includes(normalized);
};

const normalizeSortOrder = (sortOrder) => {
  const normalized = String(sortOrder || "").toLowerCase();
  return normalized === "asc" ? "asc" : PAGINATION_DEFAULTS.SORT_ORDER;
};

/**
 * Normalizes list query parameters into a canonical pagination object.
 *
 * @param {Record<string, unknown>} [query={}] - Raw query object.
 * @returns {{
 *   page: number;
 *   limit: number;
 *   skip: number;
 *   sortBy: string;
 *   sortOrder: "asc" | "desc";
 *   sort: Record<string, 1 | -1>;
 *   paginateOptions: {
 *     page: number;
 *     limit: number;
 *     sort: Record<string, 1 | -1>;
 *   };
 *   includeDeleted: boolean;
 * }} Normalized pagination payload.
 * @throws {never} Invalid values are normalized to defaults.
 */
export const parsePagination = (query = {}) => {
  const page = Math.max(toInteger(query.page, PAGINATION_DEFAULTS.PAGE), 1);
  const limit = Math.min(
    Math.max(toInteger(query.limit, PAGINATION_DEFAULTS.LIMIT), 1),
    PAGINATION_DEFAULTS.MAX_LIMIT
  );

  const sortBy = query.sortBy || PAGINATION_DEFAULTS.SORT_BY;
  const sortOrder = normalizeSortOrder(query.sortOrder);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const includeDeleted = toBoolean(
    query.includeDeleted,
    PAGINATION_DEFAULTS.INCLUDE_DELETED
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder,
    sort,
    paginateOptions: {
      page,
      limit,
      sort,
    },
    includeDeleted,
  };
};

/**
 * Converts a date-like value to UTC ISO string.
 *
 * @param {Date | string | number} [date=new Date()] - Date-like input.
 * @returns {string} UTC ISO string.
 * @throws {RangeError} Throws when provided date value is invalid.
 */
export const toUTCISOString = (date = new Date()) => {
  return new Date(date).toISOString();
};

/**
 * Builds canonical success response payload.
 *
 * @param {{ message?: string; data?: Record<string, unknown> }} [options={}] - Success payload options.
 * @returns {{ success: true; message: string } & Record<string, unknown>} Success response object.
 * @throws {never} This helper does not throw.
 */
export const buildSuccessResponse = ({
  message = "Operation successful",
  data = {},
} = {}) => {
  return {
    success: true,
    message,
    ...data,
  };
};

/**
 * Builds canonical paginated response payload.
 *
 * @param {{
 *   payloadKey: string;
 *   payload?: unknown[];
 *   page?: number;
 *   limit?: number;
 *   totalDocs?: number;
 *   paginationResult?: {
 *     docs?: unknown[];
 *     totalDocs: number;
 *     limit: number;
 *     page: number;
 *     totalPages: number;
 *     hasNextPage: boolean;
 *     hasPrevPage: boolean;
 *   };
 * }} options - Pagination response options.
 * @returns {{
 *   success: true;
 *   pagination: {
 *     totalItems: number;
 *     totalDocs: number;
 *     limit: number;
 *     page: number;
 *     totalPages: number;
 *     hasNextPage: boolean;
 *     hasPrevPage: boolean;
 *   };
 * } & Record<string, unknown>} Paginated response object.
 * @throws {never} This helper does not throw.
 */
export const buildPaginatedResponse = ({
  payloadKey,
  payload = [],
  page = PAGINATION_DEFAULTS.PAGE,
  limit = PAGINATION_DEFAULTS.LIMIT,
  totalDocs = 0,
  paginationResult = null,
}) => {
  const resolvedPayload =
    paginationResult?.docs && Array.isArray(paginationResult.docs)
      ? paginationResult.docs
      : payload;
  const resolvedTotalDocs = Number(paginationResult?.totalDocs ?? totalDocs);
  const resolvedLimit = Number(paginationResult?.limit ?? limit);
  const resolvedPage = Number(paginationResult?.page ?? page);
  const resolvedTotalPages = Number(
    paginationResult?.totalPages ?? Math.max(Math.ceil(resolvedTotalDocs / resolvedLimit), 1)
  );
  const hasNextPage = Boolean(
    paginationResult?.hasNextPage ?? resolvedPage < resolvedTotalPages
  );
  const hasPrevPage = Boolean(
    paginationResult?.hasPrevPage ?? resolvedPage > PAGINATION_DEFAULTS.PAGE
  );

  return {
    success: true,
    pagination: {
      totalItems: resolvedTotalDocs,
      totalDocs: resolvedTotalDocs,
      limit: resolvedLimit,
      page: resolvedPage,
      totalPages: resolvedTotalPages,
      hasNextPage,
      hasPrevPage,
    },
    [payloadKey]: resolvedPayload,
  };
};

/**
 * Returns a shallow copy containing only keys with defined values.
 *
 * @param {Record<string, unknown>} [obj={}] - Source object.
 * @returns {Record<string, unknown>} Object with undefined values removed.
 * @throws {never} This helper does not throw.
 */
export const pickDefined = (obj = {}) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {});
};

/**
 * Normalizes id-like values into a string or null.
 *
 * @param {unknown} value - Id-like value.
 * @returns {string | null} Normalized id string or null when absent.
 * @throws {never} This helper does not throw.
 */
export const normalizeId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value.toString) {
    return value.toString();
  }

  return String(value);
};

/**
 * Normalizes a string into a valid email local-part token.
 *
 * @param {string} value - Candidate string.
 * @returns {string} Lower-cased alphanumeric token.
 * @throws {never} This helper does not throw.
 */
export const normalizeEmailLocalPart = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return normalized || "user";
};

/**
 * Builds a Gmail address using first-name style local-part normalization.
 *
 * @param {string} firstName - Name token.
 * @param {string} [domain="gmail.com"] - Email domain.
 * @returns {string} Normalized Gmail address.
 * @throws {never} This helper does not throw.
 */
export const toGmailAddress = (firstName, domain = "gmail.com") => {
  return `${normalizeEmailLocalPart(firstName)}@${String(domain || "gmail.com")
    .trim()
    .toLowerCase()}`;
};

/**
 * Returns true when runtime environment is development.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Environment object.
 * @returns {boolean} Development mode flag.
 * @throws {never} This helper does not throw.
 */
export const isDevelopmentEnv = (env = process.env) => {
  return String(env.NODE_ENV || "development").trim().toLowerCase() === "development";
};

/**
 * Converts a date-like value into ISO-8601 timestamp.
 *
 * @param {Date | string | number} [value=new Date()] - Date-like input.
 * @returns {string} ISO-8601 timestamp.
 * @throws {RangeError} Throws when date cannot be parsed.
 */
export const toISODateTime = (value = new Date()) => {
  return new Date(value).toISOString();
};

/**
 * Runs a callback in a MongoDB transaction and guarantees session cleanup.
 *
 * @template T
 * @param {(session: import("mongoose").ClientSession) => Promise<T>} work - Transaction callback.
 * @returns {Promise<T>} Callback result.
 * @throws {Error} Re-throws callback errors after transaction abort.
 */
export const withMongoTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return /** @type {T} */ (result);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
