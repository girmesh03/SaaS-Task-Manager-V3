/**
 * @file Development database wipe script.
 */
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import logger from "../utils/logger.js";
import { assertDevelopmentRuntime, wipeDatabase } from "./dbUtils.js";

dotenv.config();

/**
 * Runs wipe flow.
 *
 * @returns {Promise<void>}
 */
const runWipe = async () => {
  assertDevelopmentRuntime(process.env);
  await connectDB();

  try {
    const result = await wipeDatabase();
    logger.info("Development wipe completed", result);
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
