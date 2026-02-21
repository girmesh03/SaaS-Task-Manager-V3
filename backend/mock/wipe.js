/**
 * @file Development database wipe script.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { isDevelopmentEnv } from "../utils/helpers.js";
import logger from "../utils/logger.js";

dotenv.config();

/**
 * Throws when runtime is not development.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Environment object.
 * @returns {void}
 * @throws {Error} Throws for non-development environments.
 */
const assertDevelopmentRuntime = (env = process.env) => {
  if (!isDevelopmentEnv(env)) {
    throw new Error("Wipe script is allowed only in development mode");
  }
};

/**
 * Drops the active MongoDB database.
 *
 * @returns {Promise<void>}
 */
const wipeDatabase = async () => {
  if (!mongoose.connection?.db) {
    throw new Error("Database connection is not initialized");
  }

  await mongoose.connection.db.dropDatabase();
};

/**
 * Runs wipe flow.
 *
 * @returns {Promise<void>}
 */
const runWipe = async () => {
  assertDevelopmentRuntime(process.env);
  await connectDB();

  try {
    await wipeDatabase();
    logger.info("Development wipe completed");
  } finally {
    await disconnectDB();
  }
};

runWipe()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Wipe script failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

