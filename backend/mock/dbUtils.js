/**
 * @file Mock database utilities (wipe + runtime guards).
 */
import mongoose from "mongoose";
import { isDevelopmentEnv } from "../utils/helpers.js";

/**
 * Throws when runtime is not development.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Environment object.
 * @returns {void}
 * @throws {Error} Throws for non-development environments.
 */
export const assertDevelopmentRuntime = (env = process.env) => {
  if (!isDevelopmentEnv(env)) {
    throw new Error("This script is allowed only in development mode");
  }
};

/**
 * Deletes documents from all collections in the active database.
 *
 * Uses deleteMany (instead of dropDatabase) to work with hosted MongoDB users
 * that don't have dropDatabase privileges.
 *
 * @param {{ session?: import("mongoose").ClientSession | null }} [options] - Options.
 * @returns {Promise<{ collections: number }>} Wipe summary.
 * @throws {Error} Throws when connection isn't initialized or delete fails.
 */
export const wipeDatabase = async ({ session = null } = {}) => {
  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error("Database connection is not initialized");
  }

  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();

  const names = collections
    .map((entry) => entry?.name)
    .filter(Boolean)
    .filter((name) => !String(name).startsWith("system."));

  for (const name of names) {
    await db.collection(name).deleteMany({}, session ? { session } : undefined);
  }

  return {
    collections: names.length,
  };
};

export default {
  assertDevelopmentRuntime,
  wipeDatabase,
};

