/**
 * @file Environment validation helpers.
 */
import { ENV_KEYS, NODE_ENVS } from "./constants.js";
import { ValidationError } from "./errors.js";
import { applyResolvedEnvironment, resolveEnvironment } from "./env.js";

const parseBoolean = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
};

const parseSameSite = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return ["strict", "lax", "none"].includes(value.trim().toLowerCase());
};

/**
 * Validates required backend environment variables and normalized constraints.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Environment map to validate.
 * @returns {{ valid: true; resolved: ReturnType<typeof resolveEnvironment>; validatedAt: string }} Validation summary payload.
 * @throws {ValidationError} Throws when required keys or constraints are invalid.
 */
export const validateEnv = (env = process.env) => {
  const resolved = resolveEnvironment(env);
  applyResolvedEnvironment(resolved, env);

  const missing = ENV_KEYS.REQUIRED.filter((key) => {
    const value = resolved[key];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    throw new ValidationError("Missing required environment variables", {
      missing,
    });
  }

  if (!Object.values(NODE_ENVS).includes(resolved.NODE_ENV)) {
    throw new ValidationError("Invalid NODE_ENV value", {
      allowed: Object.values(NODE_ENVS),
      received: resolved.NODE_ENV,
    });
  }

  if (!parseBoolean(resolved.COOKIE_SECURE)) {
    if (resolved.NODE_ENV === NODE_ENVS.PRODUCTION) {
      throw new ValidationError(
        "COOKIE_SECURE must be true in production environments"
      );
    }
  }

  if (!parseSameSite(resolved.COOKIE_SAME_SITE)) {
    throw new ValidationError("COOKIE_SAME_SITE must be one of: strict, lax, none");
  }

  const emailPort = Number(resolved.EMAIL_PORT);
  if (!Number.isInteger(emailPort) || emailPort <= 0) {
    throw new ValidationError("EMAIL_PORT must be a positive integer");
  }

  if (resolved.NODE_ENV === NODE_ENVS.PRODUCTION) {
    const missingCloudinary = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ].filter((key) => !resolved[key]);

    if (missingCloudinary.length > 0) {
      throw new ValidationError(
        "Cloudinary configuration is required in production environments",
        { missing: missingCloudinary }
      );
    }
  }

  return {
    valid: true,
    resolved,
    validatedAt: new Date().toISOString(),
  };
};
