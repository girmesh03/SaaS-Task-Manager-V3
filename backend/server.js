/**
 * @file Backend HTTP bootstrap and graceful shutdown orchestration.
 */
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { getAllowedOrigins } from "./config/allowedOrigins.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initializeSocketService, closeSocketService } from "./services/socketService.js";
import { validateEnv } from "./utils/validateEnv.js";
import logger from "./utils/logger.js";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
let server;
let shuttingDown = false;

/**
 * Starts the backend runtime by validating environment variables, connecting to
 * MongoDB, initializing Socket.IO, and binding the HTTP listener.
 *
 * @returns {Promise<void>} Resolves after the listener is active.
 * @throws {Error} Throws when env validation, DB connection, socket initialization, or listener startup fails.
 */
const startServer = async () => {
  const envValidation = validateEnv(process.env);
  const resolvedEnv = envValidation.resolved;

  logger.info("Environment validation passed");

  await connectDB();
  logger.info("Database connection established");

  server = http.createServer(app);

  initializeSocketService(server, {
    jwtSecret: resolvedEnv.JWT_ACCESS_SECRET,
    corsOrigin: getAllowedOrigins(),
  });

  await new Promise((resolve, reject) => {
    const handleListenError = (error) => {
      reject(error);
    };

    server.once("error", handleListenError);
    server.listen(PORT, () => {
      server.off("error", handleListenError);
      logger.info("HTTP server started", { port: PORT });
      resolve();
    });
  });
};

/**
 * Handles graceful process shutdown by stopping the HTTP listener, closing
 * socket resources, and closing database resources.
 *
 * @param {"SIGINT" | "SIGTERM"} signal - The process signal that initiated shutdown.
 * @returns {Promise<void>} Resolves after shutdown path completes.
 * @throws {never} This function handles internal errors and terminates the process explicitly.
 */
const gracefulShutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.warn("Shutdown signal received", { signal });

  const forceTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      logger.info("HTTP server stopped accepting requests");
    }

    await closeSocketService();
    logger.info("Socket service closed");

    await disconnectDB();
    logger.info("Database connection closed");

    clearTimeout(forceTimeout);
    process.exit(0);
  } catch (error) {
    logger.error("Graceful shutdown failed", {
      message: error.message,
      stack: error.stack,
    });

    clearTimeout(forceTimeout);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer().catch((error) => {
  logger.error("Server startup failed", {
    message: error.message,
    stack: error.stack,
  });

  process.exit(1);
});
