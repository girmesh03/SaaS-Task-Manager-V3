import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";

const app = express();

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/", (req, res, next) => {
  res.status(200).json({ message: "received get request" });
});

export default app;
