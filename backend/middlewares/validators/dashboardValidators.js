/**
 * @file Dashboard endpoint validators.
 */
import { param, query } from "express-validator";
import Department from "../../models/Department.js";
import {
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const ensureDepartmentExists = async (value) => {
  const department = await Department.findById(value).withDeleted();
  if (!department) {
    throw new Error("Department not found");
  }

  return true;
};

/**
 * Validators for `GET /api/dashboard/overview`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const dashboardOverviewValidators = [
  isoDateQuery("from"),
  isoDateQuery("to"),
  query("departmentId")
    .optional()
    .isMongoId()
    .withMessage("departmentId must be a valid object id"),
];

/**
 * Validators for common `:departmentId` params in dashboard routes.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const departmentDashboardPathValidators = [
  objectIdParam("departmentId"),
  param("departmentId").custom(ensureDepartmentExists),
];

/**
 * Validators for `GET /api/departments/:departmentId/dashboard`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const departmentOverviewValidators = [...departmentDashboardPathValidators];

/**
 * Validators for `GET /api/departments/:departmentId/activity`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const departmentActivityFeedValidators = [
  ...departmentDashboardPathValidators,
  ...paginationValidators(),
  query("entityModel").optional().isString().trim(),
  isoDateQuery("from"),
  isoDateQuery("to"),
];
