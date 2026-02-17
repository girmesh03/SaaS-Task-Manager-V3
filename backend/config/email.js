/**
 * @file Email transport configuration resolver.
 */
import logger from "../utils/logger.js";
import { resolveEnvironment } from "../utils/env.js";

const REQUIRED_KEYS = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM"];

/**
 * Resolves SMTP/email transport configuration and toggles availability when values are missing.
 *
 * @returns {{
 *   enabled: boolean;
 *   host: string;
 *   port: number;
 *   secure: boolean;
 *   auth: { user: string; pass: string };
 *   from: string;
 * }} Normalized email configuration payload.
 * @throws {Error} Throws in production when required email values are missing.
 */
export const getEmailConfig = () => {
  const env = resolveEnvironment(process.env);
  const config = {
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT),
    secure: Number(env.EMAIL_PORT) === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
    from: env.EMAIL_FROM,
  };

  const missing = REQUIRED_KEYS.filter((key) => !env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Email configuration is required in production. Missing: ${missing.join(", ")}`
      );
    }

    logger.warn("Email transport is not fully configured. Email features are disabled.", {
      missing,
    });

    return {
      enabled: false,
      ...config,
    };
  }

  return {
    enabled: true,
    ...config,
  };
};

export default getEmailConfig;
