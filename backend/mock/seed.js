/**
 * @file Phase 1 seed-script placeholder.
 *
 * Model-backed seeding is deferred to Phase 2. This placeholder keeps the
 * command operational and documents the required env-based source of truth.
 */

import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { PLATFORM_SEED_ENV_KEYS } from "./data.js";

dotenv.config();

/**
 * Executes the Phase 1 seed placeholder routine.
 *
 * @returns {Promise<void>} Resolves after logging deferred implementation guidance.
 * @throws {never} This placeholder handles all failures internally.
 */
const runSeedPlaceholder = async () => {
  const configuredKeyCount = Object.values(PLATFORM_SEED_ENV_KEYS)
    .flat()
    .filter((key) => Boolean(process.env[key])).length;

  logger.warn("Seed script is a Phase 1 placeholder. No database writes were performed.", {
    plannedPhase: "PHASE_2",
    configuredKeyCount,
    requiredEnvGroups: PLATFORM_SEED_ENV_KEYS,
  });
};

runSeedPlaceholder()
  .then(() => {
    logger.info("Seed placeholder completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Seed placeholder failed unexpectedly", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
