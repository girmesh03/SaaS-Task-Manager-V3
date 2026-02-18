/**
 * @file API error normalization and toast helpers.
 */
import { toast } from "react-toastify";
import { HTTP_STATUS } from "./constants";

/**
 * Normalizes RTK Query/fetch errors to a consistent shape.
 *
 * @param {unknown} error - Raw error object.
 * @returns {{
 *   status: number;
 *   message: string;
 *   details: unknown;
 *   code: string | null;
 * }} Normalized error payload.
 * @throws {never} This helper does not throw.
 */
export const normalizeApiError = (error) => {
  const status = Number(error?.status || error?.originalStatus || 0);
  const payload = error?.data || {};
  const payloadError = payload?.error || {};
  const message =
    payload?.message ||
    error?.error ||
    "Something went wrong. Please try again.";

  return {
    status,
    message,
    details: payload?.details || null,
    code: payloadError?.code || payloadError?.type || null,
  };
};

/**
 * Emits canonical toast feedback for API errors.
 *
 * @param {unknown} error - Raw API error.
 * @returns {{ shouldLogout: boolean; shouldRetryRefresh: boolean }} UX policy flags.
 * @throws {never} This helper does not throw.
 */
export const toastApiError = (error) => {
  const normalized = normalizeApiError(error);
  const fallbackMessageByStatus = {
    [HTTP_STATUS.CONFLICT]: "The requested change conflicts with current data.",
    [HTTP_STATUS.TOO_MANY_REQUESTS]: "Too many requests. Please try again shortly.",
    0: "Network error. Please check your connection and retry.",
  };

  const message = normalized.message || fallbackMessageByStatus[normalized.status];

  if (normalized.status === HTTP_STATUS.FORBIDDEN) {
    toast.error(message);
    return {
      shouldLogout: false,
      shouldRetryRefresh: false,
    };
  }

  toast.error(message);

  return {
    shouldLogout: normalized.status === HTTP_STATUS.UNAUTHORIZED,
    shouldRetryRefresh: normalized.status === HTTP_STATUS.UNAUTHORIZED,
  };
};

export default {
  normalizeApiError,
  toastApiError,
};
