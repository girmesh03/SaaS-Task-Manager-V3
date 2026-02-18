/**
 * @file Material endpoint validators.
 */
import { body, param, query } from "express-validator";
import Material from "../../models/Material.js";
import Task from "../../models/Task.js";
import TaskActivity from "../../models/TaskActivity.js";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_STATUS,
  SKU_REGEX,
  TASK_TYPE,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";
import {
  csvEnumQuery,
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const SKU_REGEX_CASE_INSENSITIVE = new RegExp(SKU_REGEX.source, "i");

const ensureMaterialExists = async (value) => {
  const material = await Material.findById(value).withDeleted();
  if (!material) {
    throw new Error("Material not found");
  }

  return true;
};

const ensureMaterialNotAssociated = async (value) => {
  const routineAssociation = await Task.findOne({
    type: TASK_TYPE.ROUTINE,
    "materials.material": value,
  })
    .withDeleted()
    .select("_id");

  if (routineAssociation) {
    throw new Error("Material is associated with routine tasks. Set status to INACTIVE instead.");
  }

  const activityAssociation = await TaskActivity.findOne({
    "materials.material": value,
  })
    .withDeleted()
    .select("_id");

  if (activityAssociation) {
    throw new Error("Material is associated with task activities. Set status to INACTIVE instead.");
  }

  return true;
};

/**
 * Validators for `GET /api/materials`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listMaterialValidators = [
  ...paginationValidators(),
  query("organizationId")
    .optional()
    .isMongoId()
    .withMessage("organizationId must be a valid object id"),
  query("departmentId")
    .optional()
    .isMongoId()
    .withMessage("departmentId must be a valid object id"),
  csvEnumQuery("category", MATERIAL_CATEGORIES),
  csvEnumQuery("status", Object.values(MATERIAL_STATUS)),
  query("sku").optional().isString().trim(),
  query("lowStockOnly")
    .optional()
    .isBoolean()
    .withMessage("lowStockOnly must be a boolean"),
  isoDateQuery("createdFrom"),
  isoDateQuery("createdTo"),
];

/**
 * Validators for `POST /api/materials`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createMaterialValidators = [
  body("name")
    .isString()
    .withMessage("Material name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.MATERIAL.NAME_MIN,
      max: VALIDATION_LIMITS.MATERIAL.NAME_MAX,
    })
    .withMessage("Material name must be between 2 and 200 characters"),
  body("sku")
    .isString()
    .withMessage("SKU is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.MATERIAL.SKU_MIN,
      max: VALIDATION_LIMITS.MATERIAL.SKU_MAX,
    })
    .withMessage("SKU must be between 2 and 30 characters")
    .matches(SKU_REGEX_CASE_INSENSITIVE)
    .withMessage("SKU format is invalid"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(MATERIAL_STATUS))
    .withMessage("Material status is invalid"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.MATERIAL.DESCRIPTION_MAX })
    .withMessage("Material description cannot exceed 1000 characters"),
  body("unit")
    .isString()
    .withMessage("Unit is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.MATERIAL.UNIT_MIN,
      max: VALIDATION_LIMITS.MATERIAL.UNIT_MAX,
    })
    .withMessage("Unit must be between 1 and 50 characters"),
  body("category")
    .isIn(MATERIAL_CATEGORIES)
    .withMessage("Material category is invalid"),
  body("price")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.PRICE_MIN })
    .withMessage("Material price must be greater than or equal to 0"),
  body("inventory")
    .optional()
    .isObject()
    .withMessage("inventory must be an object"),
  body("inventory.stockOnHand")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN })
    .withMessage("inventory.stockOnHand must be greater than or equal to 0"),
  body("inventory.lowStockThreshold")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN })
    .withMessage("inventory.lowStockThreshold must be greater than or equal to 0"),
  body("inventory.reorderQuantity")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN })
    .withMessage("inventory.reorderQuantity must be greater than or equal to 0"),
];

/**
 * Validators for `:materialId` path parameter.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const materialIdValidators = [
  objectIdParam("materialId"),
  param("materialId").custom(ensureMaterialExists),
];

/**
 * Validators for `PUT /api/materials/:materialId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateMaterialValidators = [
  ...materialIdValidators,
  body("name")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.MATERIAL.NAME_MIN,
      max: VALIDATION_LIMITS.MATERIAL.NAME_MAX,
    })
    .withMessage("Material name must be between 2 and 200 characters"),
  body("sku")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.MATERIAL.SKU_MIN,
      max: VALIDATION_LIMITS.MATERIAL.SKU_MAX,
    })
    .matches(SKU_REGEX_CASE_INSENSITIVE)
    .withMessage("SKU format is invalid"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(MATERIAL_STATUS))
    .withMessage("Material status is invalid"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.MATERIAL.DESCRIPTION_MAX })
    .withMessage("Material description cannot exceed 1000 characters"),
  body("unit")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.MATERIAL.UNIT_MIN,
      max: VALIDATION_LIMITS.MATERIAL.UNIT_MAX,
    })
    .withMessage("Unit must be between 1 and 50 characters"),
  body("category")
    .optional({ values: "falsy" })
    .isIn(MATERIAL_CATEGORIES)
    .withMessage("Material category is invalid"),
  body("price")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.PRICE_MIN })
    .withMessage("Material price must be greater than or equal to 0"),
  body("inventory.lowStockThreshold")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN })
    .withMessage("inventory.lowStockThreshold must be greater than or equal to 0"),
];

/**
 * Validators for `POST /api/materials/:materialId/restock`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restockMaterialValidators = [
  ...materialIdValidators,
  body("quantity")
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.UNIT_MIN })
    .withMessage("quantity must be greater than 0"),
  body("note")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("note must be a string")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.MATERIAL.RESTOCK_NOTE_MAX })
    .withMessage("note cannot exceed 500 characters"),
];

/**
 * Validators for `DELETE /api/materials/:materialId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteMaterialValidators = [
  ...materialIdValidators,
  param("materialId").custom(ensureMaterialNotAssociated),
];

/**
 * Validators for `PATCH /api/materials/:materialId/restore`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreMaterialValidators = [...materialIdValidators];

/**
 * Validators for `GET /api/materials/:materialId/usage`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const materialUsageValidators = [
  ...materialIdValidators,
  ...paginationValidators(),
];
