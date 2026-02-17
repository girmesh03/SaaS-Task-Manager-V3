/**
 * @file Environment normalization utilities.
 */
const toStringOrEmpty = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const firstCsvValue = (value) => {
  const normalized = toStringOrEmpty(value);
  if (!normalized) {
    return "";
  }

  return normalized
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean);
};

/**
 * Normalizes environment variables into canonical backend keys.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Source environment map.
 * @returns {{
 *   NODE_ENV: string;
 *   PORT: string;
 *   MONGO_URI: string;
 *   JWT_ACCESS_SECRET: string;
 *   JWT_REFRESH_SECRET: string;
 *   JWT_ACCESS_EXPIRES_IN: string;
 *   JWT_REFRESH_EXPIRES_IN: string;
 *   COOKIE_NAME_ACCESS: string;
 *   COOKIE_NAME_REFRESH: string;
 *   COOKIE_SECURE: string;
 *   COOKIE_SAME_SITE: string;
 *   CLIENT_ORIGIN: string;
 *   CORS_ALLOWED_ORIGINS: string;
 *   EMAIL_HOST: string;
 *   EMAIL_PORT: string;
 *   EMAIL_USER: string;
 *   EMAIL_PASS: string;
 *   EMAIL_FROM: string;
 *   CLOUDINARY_CLOUD_NAME: string;
 *   CLOUDINARY_API_KEY: string;
 *   CLOUDINARY_API_SECRET: string;
 * }} Normalized environment payload.
 * @throws {never} This function only normalizes values.
 */
export const resolveEnvironment = (env = process.env) => {
  const nodeEnv = toStringOrEmpty(env.NODE_ENV) || "development";
  const corsOrigins =
    toStringOrEmpty(env.CORS_ALLOWED_ORIGINS) ||
    toStringOrEmpty(env.ALLOWED_ORIGINS);
  const clientOrigin =
    toStringOrEmpty(env.CLIENT_ORIGIN) || firstCsvValue(corsOrigins);

  const resolved = {
    NODE_ENV: nodeEnv,
    PORT: toStringOrEmpty(env.PORT) || "4000",
    MONGO_URI: toStringOrEmpty(env.MONGO_URI) || toStringOrEmpty(env.MONGODB_URI),
    JWT_ACCESS_SECRET: toStringOrEmpty(env.JWT_ACCESS_SECRET),
    JWT_REFRESH_SECRET: toStringOrEmpty(env.JWT_REFRESH_SECRET),
    JWT_ACCESS_EXPIRES_IN: toStringOrEmpty(env.JWT_ACCESS_EXPIRES_IN),
    JWT_REFRESH_EXPIRES_IN: toStringOrEmpty(env.JWT_REFRESH_EXPIRES_IN),
    COOKIE_NAME_ACCESS:
      toStringOrEmpty(env.COOKIE_NAME_ACCESS) || "accessToken",
    COOKIE_NAME_REFRESH:
      toStringOrEmpty(env.COOKIE_NAME_REFRESH) || "refreshToken",
    COOKIE_SECURE:
      toStringOrEmpty(env.COOKIE_SECURE) ||
      (nodeEnv === "production" ? "true" : "false"),
    COOKIE_SAME_SITE:
      toStringOrEmpty(env.COOKIE_SAME_SITE) ||
      (nodeEnv === "production" ? "none" : "lax"),
    CLIENT_ORIGIN: clientOrigin,
    CORS_ALLOWED_ORIGINS: corsOrigins || clientOrigin,
    EMAIL_HOST: toStringOrEmpty(env.EMAIL_HOST) || toStringOrEmpty(env.SMTP_HOST),
    EMAIL_PORT: toStringOrEmpty(env.EMAIL_PORT) || toStringOrEmpty(env.SMTP_PORT),
    EMAIL_USER: toStringOrEmpty(env.EMAIL_USER) || toStringOrEmpty(env.SMTP_USER),
    EMAIL_PASS: toStringOrEmpty(env.EMAIL_PASS) || toStringOrEmpty(env.SMTP_PASS),
    EMAIL_FROM:
      toStringOrEmpty(env.EMAIL_FROM) ||
      toStringOrEmpty(env.SMTP_FROM) ||
      toStringOrEmpty(env.EMAIL_USER) ||
      toStringOrEmpty(env.SMTP_USER),
    CLOUDINARY_CLOUD_NAME: toStringOrEmpty(env.CLOUDINARY_CLOUD_NAME),
    CLOUDINARY_API_KEY: toStringOrEmpty(env.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: toStringOrEmpty(env.CLOUDINARY_API_SECRET),
  };

  return resolved;
};

/**
 * Applies resolved environment values back into an environment object.
 *
 * @param {Record<string, string>} resolved - Resolved environment payload.
 * @param {NodeJS.ProcessEnv} [env=process.env] - Target environment map.
 * @returns {void} Mutates the target environment map in place.
 * @throws {never} This function does not throw.
 */
export const applyResolvedEnvironment = (resolved, env = process.env) => {
  Object.entries(resolved).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      env[key] = String(value);
    }
  });
};
