/**
 * @file Structured logger configuration and helpers.
 */
import winston from "winston";
import { NODE_ENVS } from "./constants.js";

const redactKeys = [
  "password",
  "token",
  "refreshToken",
  "accessToken",
  "authorization",
  "cookie",
  "cookies",
];

const redactObject = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactObject);
  }

  return Object.entries(value).reduce((acc, [key, current]) => {
    if (redactKeys.includes(key)) {
      acc[key] = "[REDACTED]";
      return acc;
    }

    acc[key] = redactObject(current);
    return acc;
  }, {});
};

const runtimeEnv = process.env.NODE_ENV || NODE_ENVS.DEVELOPMENT;
const isProduction = runtimeEnv === NODE_ENVS.PRODUCTION;

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const safeMeta = redactObject(meta);
    const metaOutput = Object.keys(safeMeta).length
      ? ` ${JSON.stringify(safeMeta)}`
      : "";

    return `${timestamp} [${level}] ${message}${metaOutput}`;
  })
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  defaultMeta: {
    service: "backend-runtime",
    env: runtimeEnv,
  },
  format: isProduction ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
});

/**
 * Logs a message with contextual metadata using redaction rules.
 *
 * @param {"error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly"} level - Winston log level.
 * @param {string} message - Log message.
 * @param {Record<string, unknown>} [context={}] - Additional contextual metadata.
 * @returns {void} Logs message to configured transport(s).
 * @throws {never} This helper does not throw.
 */
export const logWithContext = (level, message, context = {}) => {
  logger.log(level, message, redactObject(context));
};

export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
