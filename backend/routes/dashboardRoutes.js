/**
 * @file Canonical dashboard route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import { dashboardOverviewValidators } from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import { getDashboardOverview } from "../controllers/dashboardController.js";

const router = Router();

router.get(
  "/overview",
  requireAuth,
  validate(dashboardOverviewValidators),
  authorize("Organization", "read"),
  getDashboardOverview
);

export default router;
