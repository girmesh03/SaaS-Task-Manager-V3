/**
 * @file Database connection lifecycle helpers.
 */
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { resolveEnvironment } from "../utils/env.js";

let listenersRegistered = false;

const registerMongooseListeners = () => {
  if (listenersRegistered) {
    return;
  }

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected", {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", {
      message: error.message,
    });
  });

  listenersRegistered = true;
};

/**
 * Connects Mongoose using normalized environment configuration.
 *
 * @returns {Promise<import("mongoose").Connection>} Connected mongoose connection instance.
 * @throws {Error} Throws when MongoDB URI is invalid or connection fails.
 */
export const connectDB = async () => {
  registerMongooseListeners();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = resolveEnvironment(process.env).MONGO_URI;
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 15000,
  });

  return mongoose.connection;
};

/**
 * Disconnects the active Mongoose connection when connected.
 *
 * @returns {Promise<void>} Resolves when connection close flow completes.
 * @throws {Error} Throws when close operation fails.
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
};

/**
 * Returns the current Mongoose connection ready-state value.
 *
 * @returns {number} Mongoose ready-state numeric value.
 * @throws {never} This accessor does not throw.
 */
export const getDbState = () => {
  return mongoose.connection.readyState;
};

export default {
  connectDB,
  disconnectDB,
  getDbState,
};
