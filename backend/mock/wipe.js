/**
 * @file Phase 1 wipe-script placeholder.
 *
 * Data wipe logic is deferred to Phase 2 because model implementations are
 * not active in this phase.
 */

import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { PLATFORM_SEED_ENV_KEYS } from "./data.js";

dotenv.config();

/**
 * Executes the Phase 1 wipe placeholder routine.
 *
 * @returns {Promise<void>} Resolves after logging deferred implementation guidance.
 * @throws {never} This placeholder handles all failures internally.
 */
const runWipePlaceholder = async () => {
  logger.warn("Wipe script is a Phase 1 placeholder. No data was deleted.", {
    plannedPhase: "PHASE_2",
    requiredEnvGroupsForFutureMockFlows: PLATFORM_SEED_ENV_KEYS,
  });
};

runWipePlaceholder()
  .then(() => {
    logger.info("Wipe placeholder completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Wipe placeholder failed unexpectedly", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
