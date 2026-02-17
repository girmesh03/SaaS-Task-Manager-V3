/**
 * @file Cloudinary configuration resolver.
 */
import logger from "../utils/logger.js";
import { resolveEnvironment } from "../utils/env.js";

const REQUIRED_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

/**
 * Resolves Cloudinary configuration and toggles availability when values are missing.
 *
 * @returns {{
 *   enabled: boolean;
 *   cloudName: string;
 *   apiKey: string;
 *   apiSecret: string;
 * }} Normalized cloudinary configuration payload.
 * @throws {Error} Throws in production when required Cloudinary values are missing.
 */
export const getCloudinaryConfig = () => {
  const env = resolveEnvironment(process.env);
  const values = {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };

  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Cloudinary configuration is required in production. Missing: ${missing.join(", ")}`
      );
    }

    logger.warn("Cloudinary is not fully configured. File upload features are disabled.", {
      missing,
    });

    return {
      enabled: false,
      ...values,
    };
  }

  return {
    enabled: true,
    ...values,
  };
};

export default getCloudinaryConfig;
