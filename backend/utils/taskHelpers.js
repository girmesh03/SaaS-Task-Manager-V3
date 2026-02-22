/**
 * @file Task-domain helper utilities shared across task controllers.
 */

import { USER_ROLES } from "./constants.js";
import { ValidationError } from "./errors.js";
import { normalizeEmailLocalPart, normalizeId } from "./helpers.js";

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Returns true when the actor is a platform super admin.
 *
 * @param {unknown} user - Request user context.
 * @returns {boolean} True when user is platform super admin.
 * @throws {never} This helper does not throw.
 */
export const isPlatformSuperAdmin = (user) => {
  return (
    user?.role === USER_ROLES.SUPER_ADMIN && Boolean(user?.isPlatformOrgUser)
  );
};

/**
 * Enforces canonical org scoping behavior for list endpoints.
 *
 * @param {unknown} reqUser - Actor user context.
 * @param {unknown} organizationId - Optional organization id query.
 * @returns {string | null} Resolved organization id.
 * @throws {ValidationError} Throws when org query is supplied by non-platform users.
 */
export const ensureOrgScopeQuery = (reqUser, organizationId) => {
  if (!organizationId) {
    return normalizeId(reqUser?.organization);
  }

  if (!isPlatformSuperAdmin(reqUser)) {
    throw new ValidationError(
      "organizationId query is only allowed for platform SuperAdmin users"
    );
  }

  return normalizeId(organizationId);
};

/**
 * Builds canonical pagination metadata from paginate-v2 results.
 *
 * @param {Record<string, unknown>} result - Paginate result object.
 * @returns {{
 *   totalDocs: number;
 *   totalItems: number;
 *   limit: number;
 *   page: number;
 *   totalPages: number;
 *   hasNextPage: boolean;
 *   hasPrevPage: boolean;
 * }} Pagination metadata.
 * @throws {never} This helper does not throw.
 */
export const buildPaginationMeta = (result) => ({
  totalDocs: toInteger(result?.totalDocs, 0),
  totalItems: toInteger(result?.totalDocs, 0),
  limit: toInteger(result?.limit, 20),
  page: toInteger(result?.page, 1),
  totalPages: toInteger(result?.totalPages, 1),
  hasNextPage: Boolean(result?.hasNextPage),
  hasPrevPage: Boolean(result?.hasPrevPage),
});

/**
 * Parses a comma-separated string into a list of trimmed values.
 *
 * @param {unknown} value - Candidate CSV value.
 * @returns {string[]} Parsed tokens.
 * @throws {never} This helper does not throw.
 */
export const parseCsv = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Builds a MongoDB date range filter when from/to are supplied.
 *
 * @param {unknown} from - ISO-8601 from date.
 * @param {unknown} to - ISO-8601 to date.
 * @returns {{ $gte?: Date; $lte?: Date } | null} Range filter or null.
 * @throws {ValidationError} Throws when from is after to.
 */
export const buildDateRangeFilter = (from, to) => {
  if (!from && !to) {
    return null;
  }

  const range = {};
  if (from) {
    range.$gte = new Date(from);
  }
  if (to) {
    range.$lte = new Date(to);
  }

  if (
    range.$gte &&
    range.$lte &&
    range.$gte.getTime() > range.$lte.getTime()
  ) {
    throw new ValidationError("Date range is invalid");
  }

  return range;
};

/**
 * Normalizes a list of task tags into unique lower-case tokens.
 *
 * @param {unknown} tags - Tags array candidate.
 * @returns {string[]} Normalized tags.
 * @throws {never} This helper does not throw.
 */
export const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const normalized = tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

/**
 * Computes quantity deltas for two material-usage arrays.
 *
 * @param {{
 *   before?: Array<{ material?: unknown; materialId?: unknown; quantity?: unknown }>;
 *   after?: Array<{ material?: unknown; materialId?: unknown; quantity?: unknown }>;
 * }} options - Usage arrays.
 * @returns {Map<string, number>} Map of materialId -> (afterQty - beforeQty).
 * @throws {never} This helper does not throw.
 */
export const computeMaterialQuantityDeltas = ({ before = [], after = [] } = {}) => {
  const beforeMap = new Map();
  const afterMap = new Map();

  (Array.isArray(before) ? before : []).forEach((entry) => {
    const id = normalizeId(entry?.material || entry?.materialId);
    if (!id) {
      return;
    }
    const qty = Number(entry?.quantity || 0);
    beforeMap.set(id, qty);
  });

  (Array.isArray(after) ? after : []).forEach((entry) => {
    const id = normalizeId(entry?.material || entry?.materialId);
    if (!id) {
      return;
    }
    const qty = Number(entry?.quantity || 0);
    afterMap.set(id, qty);
  });

  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const deltas = new Map();
  ids.forEach((id) => {
    const beforeQty = Number(beforeMap.get(id) || 0);
    const afterQty = Number(afterMap.get(id) || 0);
    const delta = afterQty - beforeQty;
    if (delta !== 0) {
      deltas.set(id, delta);
    }
  });

  return deltas;
};

/**
 * Extracts and normalizes @mention tokens from a comment string.
 *
 * @param {unknown} comment - Raw comment text.
 * @returns {string[]} Unique normalized mention tokens.
 * @throws {never} This helper does not throw.
 */
export const extractMentionTokens = (comment) => {
  const text = String(comment || "");
  const matches = text.matchAll(/@([a-zA-Z0-9][a-zA-Z0-9._-]*)/g);
  const tokens = [];

  for (const match of matches) {
    const token = match?.[1];
    if (!token) {
      continue;
    }

    tokens.push(normalizeEmailLocalPart(token));
  }

  return Array.from(new Set(tokens)).filter(Boolean);
};

export default {
  isPlatformSuperAdmin,
  ensureOrgScopeQuery,
  buildPaginationMeta,
  parseCsv,
  buildDateRangeFilter,
  normalizeTags,
  computeMaterialQuantityDeltas,
  extractMentionTokens,
};
