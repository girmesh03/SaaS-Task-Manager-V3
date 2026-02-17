/**
 * @file Allowed-origin resolution helpers for CORS configuration.
 */
import { resolveEnvironment } from "../utils/env.js";

const splitCsv = (value = "") => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Resolves the allowed CORS origin list from normalized environment values.
 *
 * @returns {string[]} Unique list of non-empty allowed origins.
 * @throws {never} This resolver does not throw; invalid inputs are normalized.
 */
export const getAllowedOrigins = () => {
  const resolvedEnv = resolveEnvironment(process.env);
  const directOrigin = resolvedEnv.CLIENT_ORIGIN || "";
  const listOrigins = splitCsv(resolvedEnv.CORS_ALLOWED_ORIGINS || "");

  return Array.from(new Set([...listOrigins, directOrigin].filter(Boolean)));
};

export const allowedOrigins = getAllowedOrigins();

export default allowedOrigins;
