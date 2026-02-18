/**
 * @file Phase 2 wipe script for repeatable manual verification cycles.
 */
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import {
  Attachment,
  Department,
  Material,
  Notification,
  Organization,
  Task,
  TaskActivity,
  TaskComment,
  User,
  Vendor,
} from "../models/index.js";
import logger from "../utils/logger.js";

dotenv.config();

const ensureSafeRuntime = () => {
  const env = String(process.env.NODE_ENV || "development").toLowerCase();
  if (env === "production") {
    throw new Error("Wipe script is blocked in production environments");
  }
};

const wipeCollections = async () => {
  const models = [
    Attachment,
    Notification,
    TaskComment,
    TaskActivity,
    Task,
    Material,
    Vendor,
    User,
    Department,
    Organization,
  ];

  for (const Model of models) {
    await Model.deleteMany({});
  }
};

const runWipe = async () => {
  ensureSafeRuntime();
  await connectDB();
  await wipeCollections();
};

runWipe()
  .then(async () => {
    await disconnectDB();
    logger.info("Wipe script completed successfully");
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error("Wipe script failed", {
      message: error.message,
      stack: error.stack,
    });

    await disconnectDB();
    process.exit(1);
  });
