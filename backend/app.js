/**
 * @file Backend Express application composition for Phase 1 runtime baseline.
 * @throws {never} Module initialization does not throw.
 */
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import apiRoutes from "./routes/index.js";
import corsOptions from "./config/corsOptions.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { buildSuccessResponse, toUTCISOString } from "./utils/helpers.js";
import logger, { morganStream } from "./utils/logger.js";

const app = express();

if ((process.env.NODE_ENV || "development") === "development") {
  app.use(morgan("dev", { stream: morganStream }));
}

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(apiRateLimiter);

app.get("/", (_req, res) => {
  res.status(200).json(
    buildSuccessResponse({
      message: "TaskManager backend runtime is healthy",
      data: {
        timestamp: toUTCISOString(),
      },
    })
  );
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: toUTCISOString(),
  });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

logger.debug("Express app initialized");

export default app;
