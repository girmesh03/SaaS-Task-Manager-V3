/**
 * @file Canonical department route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createDepartmentValidators,
  deleteDepartmentValidators,
  departmentActivityValidators,
  departmentDashboardValidators,
  departmentIdValidators,
  listDepartmentValidators,
  restoreDepartmentValidators,
  updateDepartmentValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getDepartmentActivity,
  getDepartmentDashboard,
  listDepartments,
  restoreDepartment,
  updateDepartment,
} from "../controllers/departmentController.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listDepartmentValidators),
  authorize("Department", "read"),
  listDepartments
);
router.post(
  "/",
  requireAuth,
  validate(createDepartmentValidators),
  authorize("Department", "create"),
  createDepartment
);
router.get(
  "/:departmentId",
  requireAuth,
  validate(departmentIdValidators),
  authorize("Department", "read"),
  getDepartment
);
router.get(
  "/:departmentId/activity",
  requireAuth,
  validate(departmentActivityValidators),
  authorize("Department", "read"),
  getDepartmentActivity
);
router.get(
  "/:departmentId/dashboard",
  requireAuth,
  validate(departmentDashboardValidators),
  authorize("Department", "read"),
  getDepartmentDashboard
);
router.put(
  "/:departmentId",
  requireAuth,
  validate(updateDepartmentValidators),
  authorize("Department", "update"),
  updateDepartment
);
router.delete(
  "/:departmentId",
  requireAuth,
  validate(deleteDepartmentValidators),
  authorize("Department", "delete"),
  deleteDepartment
);
router.patch(
  "/:departmentId/restore",
  requireAuth,
  validate(restoreDepartmentValidators),
  authorize("Department", "delete"),
  restoreDepartment
);

export default router;
