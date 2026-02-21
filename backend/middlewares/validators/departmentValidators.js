/**
 * @file Department endpoint validators.
 */
import { body, param, query } from "express-validator";
import Department from "../../models/Department.js";
import User from "../../models/User.js";
import {
  DEPARTMENT_STATUS,
  ORGANIZATION_NAME_REGEX,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";
import {
  csvEnumQuery,
  csvObjectIdQuery,
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const ensureDepartmentExists = async (value) => {
  const record = await Department.findById(value).withDeleted();
  if (!record) {
    throw new Error("Department not found");
  }

  return true;
};

const ensureManagerExists = async (value) => {
  if (!value) {
    return true;
  }

  const record = await User.findById(value).withDeleted();
  if (!record) {
    throw new Error("Manager user not found");
  }

  return true;
};

/**
 * Validators for `GET /api/departments`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listDepartmentValidators = [
  ...paginationValidators(),
  query("organizationId")
    .optional()
    .isMongoId()
    .withMessage("organizationId must be a valid object id"),
  csvObjectIdQuery("departmentId"),
  csvEnumQuery("status", Object.values(DEPARTMENT_STATUS)),
  query("managerId")
    .optional()
    .isMongoId()
    .withMessage("managerId must be a valid object id"),
  query("memberCountMin")
    .optional()
    .isInt({ min: VALIDATION_LIMITS.DEPARTMENT.MEMBER_COUNT_MIN })
    .withMessage("memberCountMin must be a positive integer"),
  query("memberCountMax")
    .optional()
    .isInt({ min: VALIDATION_LIMITS.DEPARTMENT.MEMBER_COUNT_MIN })
    .withMessage("memberCountMax must be a positive integer"),
  isoDateQuery("createdFrom"),
  isoDateQuery("createdTo"),
];

/**
 * Validators for `POST /api/departments`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createDepartmentValidators = [
  body("name")
    .isString()
    .withMessage("Department name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.DEPARTMENT.NAME_MIN,
      max: VALIDATION_LIMITS.DEPARTMENT.NAME_MAX,
    })
    .withMessage("Department name must be between 2 and 100 characters")
    .matches(ORGANIZATION_NAME_REGEX)
    .withMessage("Department name format is invalid"),
  body("description")
    .isString()
    .withMessage("Department description is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MIN,
      max: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MAX,
    })
    .withMessage("Department description cannot exceed 500 characters"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(DEPARTMENT_STATUS))
    .withMessage("Department status is invalid"),
  body("managerId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("managerId must be a valid object id")
    .bail()
    .custom(ensureManagerExists),
];

/**
 * Validators for `:departmentId` param.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const departmentIdValidators = [
  objectIdParam("departmentId"),
  param("departmentId").custom(ensureDepartmentExists),
];

/**
 * Validators for `PUT /api/departments/:departmentId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateDepartmentValidators = [
  ...departmentIdValidators,
  body("name")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.DEPARTMENT.NAME_MIN,
      max: VALIDATION_LIMITS.DEPARTMENT.NAME_MAX,
    })
    .matches(ORGANIZATION_NAME_REGEX)
    .withMessage("Department name format is invalid"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MAX })
    .withMessage("Department description cannot exceed 500 characters"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(DEPARTMENT_STATUS))
    .withMessage("Department status is invalid"),
  body("managerId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("managerId must be a valid object id")
    .bail()
    .custom(ensureManagerExists),
];

/**
 * Validators for `DELETE /api/departments/:departmentId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteDepartmentValidators = [...departmentIdValidators];

/**
 * Validators for `PATCH /api/departments/:departmentId/restore`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreDepartmentValidators = [...departmentIdValidators];

/**
 * Validators for `GET /api/departments/:departmentId/activity`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const departmentActivityValidators = [
  ...departmentIdValidators,
  ...paginationValidators(),
  query("entityModel").optional().isString().trim(),
  isoDateQuery("from"),
  isoDateQuery("to"),
];

/**
 * Validators for `GET /api/departments/:departmentId/dashboard`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const departmentDashboardValidators = [...departmentIdValidators];
