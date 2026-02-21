/**
 * @file Organization route contracts.
 */
import { Router } from "express";
import { listOrganizationValidators } from "../middlewares/validators/index.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import validate from "../middlewares/validation.js";
import { listOrganizations } from "../controllers/organizationController.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listOrganizationValidators),
  authorize("Organization", "read"),
  listOrganizations
);

export default router;
