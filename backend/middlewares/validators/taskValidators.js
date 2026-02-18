/**
 * @file Task endpoint validators.
 */
import { body, param, query } from "express-validator";
import Task from "../../models/Task.js";
import Vendor from "../../models/Vendor.js";
import {
  TASK_PARENT_MODELS,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";
import {
  csvEnumQuery,
  csvObjectIdQuery,
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const ensureTaskExists = async (value) => {
  const task = await Task.findById(value).withDeleted();
  if (!task) {
    throw new Error("Task not found");
  }

  return true;
};

const uniqueObjectIds = (values = []) => {
  if (!Array.isArray(values)) {
    return false;
  }

  const ids = values.map((value) => value.toString());
  return new Set(ids).size === ids.length;
};

const uniqueTags = (values = []) => {
  if (!Array.isArray(values)) {
    return false;
  }

  const tags = values.map((value) => String(value).trim().toLowerCase());
  return new Set(tags).size === tags.length;
};

/**
 * Validators for `GET /api/tasks`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listTaskValidators = [
  ...paginationValidators(),
  query("organizationId")
    .optional()
    .isMongoId()
    .withMessage("organizationId must be a valid object id"),
  csvEnumQuery("type", Object.values(TASK_TYPE)),
  csvEnumQuery("status", Object.values(TASK_STATUS)),
  csvEnumQuery("priority", Object.values(TASK_PRIORITY)),
  csvObjectIdQuery("departmentId"),
  query("assigneeId").optional().isMongoId().withMessage("assigneeId must be a valid object id"),
  query("createdById").optional().isMongoId().withMessage("createdById must be a valid object id"),
  query("watcherId").optional().isMongoId().withMessage("watcherId must be a valid object id"),
  query("vendorId").optional().isMongoId().withMessage("vendorId must be a valid object id"),
  query("materialId").optional().isMongoId().withMessage("materialId must be a valid object id"),
  isoDateQuery("startFrom"),
  isoDateQuery("startTo"),
  isoDateQuery("dueFrom"),
  isoDateQuery("dueTo"),
  query("tags").optional().isString().withMessage("tags must be a comma-separated string"),
];

/**
 * Validators for `POST /api/tasks`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createTaskValidators = [
  body("type")
    .isIn(Object.values(TASK_TYPE))
    .withMessage("Task type is invalid"),
  body("title")
    .isString()
    .withMessage("Task title is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK.TITLE_MIN,
      max: VALIDATION_LIMITS.TASK.TITLE_MAX,
    })
    .withMessage("Task title must be between 3 and 200 characters"),
  body("description")
    .isString()
    .withMessage("Task description is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK.DESCRIPTION_MIN,
      max: VALIDATION_LIMITS.TASK.DESCRIPTION_MAX,
    })
    .withMessage("Task description must be between 10 and 5000 characters"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(TASK_STATUS))
    .withMessage("Task status is invalid"),
  body("priority")
    .isIn(Object.values(TASK_PRIORITY))
    .withMessage("Task priority is invalid"),
  body("tags")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.TASK.TAGS_MAX })
    .withMessage("Task tags cannot exceed 5 entries")
    .custom(uniqueTags)
    .withMessage("Task tags must be unique"),
  body("tags.*")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.TASK.TAG_MAX_LENGTH })
    .withMessage("Each task tag must be 50 characters or less"),
  body("watchers")
    .optional()
    .isArray()
    .withMessage("watchers must be an array")
    .custom(uniqueObjectIds)
    .withMessage("watchers must be unique"),
  body("watchers.*")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("watcher ids must be valid object ids"),
  body("vendorId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("vendorId must be a valid object id")
    .bail()
    .custom(async (value) => {
      const vendor = await Vendor.findById(value).withDeleted();
      if (!vendor) {
        throw new Error("Vendor not found");
      }

      return true;
    }),
  body("assigneeIds")
    .optional()
    .isArray({
      min: VALIDATION_LIMITS.TASK.ASSIGNEES_MIN,
      max: VALIDATION_LIMITS.TASK.ASSIGNEES_MAX,
    })
    .withMessage("assigneeIds must contain between 1 and 50 users")
    .custom(uniqueObjectIds)
    .withMessage("assigneeIds must be unique"),
  body("assigneeIds.*")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("assignee ids must be valid object ids"),
  body("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be an ISO-8601 date"),
  body("dueDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("dueDate must be an ISO-8601 date"),
  body("date")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("date must be an ISO-8601 date"),
  body("materials")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.TASK.MATERIALS_MAX })
    .withMessage("materials cannot exceed 20 entries"),
  body("materials.*.materialId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("materials.materialId must be a valid object id"),
  body("materials.*.quantity")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.UNIT_MIN })
    .withMessage("materials.quantity must be greater than 0"),
  body().custom((_, { req }) => {
    const type = req.body?.type;

    if ([TASK_TYPE.PROJECT, TASK_TYPE.ASSIGNED].includes(type)) {
      if (!req.body?.startDate || !req.body?.dueDate) {
        throw new Error("startDate and dueDate are required for project and assigned tasks");
      }

      if (new Date(req.body.dueDate).getTime() <= new Date(req.body.startDate).getTime()) {
        throw new Error("dueDate must be after startDate");
      }
    }

    if (type === TASK_TYPE.PROJECT && !req.body?.vendorId) {
      throw new Error("vendorId is required for project tasks");
    }

    if (type === TASK_TYPE.ASSIGNED && (!Array.isArray(req.body?.assigneeIds) || req.body.assigneeIds.length === 0)) {
      throw new Error("assigneeIds are required for assigned tasks");
    }

    if (type === TASK_TYPE.ROUTINE && !req.body?.date) {
      throw new Error("date is required for routine tasks");
    }

    return true;
  }),
];

/**
 * Validators for common `:taskId` path parameters.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const taskIdValidators = [
  objectIdParam("taskId"),
  param("taskId").custom(ensureTaskExists),
];

/**
 * Validators for `PUT /api/tasks/:taskId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateTaskValidators = [
  ...taskIdValidators,
  body("title")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK.TITLE_MIN,
      max: VALIDATION_LIMITS.TASK.TITLE_MAX,
    })
    .withMessage("Task title must be between 3 and 200 characters"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK.DESCRIPTION_MIN,
      max: VALIDATION_LIMITS.TASK.DESCRIPTION_MAX,
    })
    .withMessage("Task description must be between 10 and 5000 characters"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(TASK_STATUS))
    .withMessage("Task status is invalid"),
  body("priority")
    .optional({ values: "falsy" })
    .isIn(Object.values(TASK_PRIORITY))
    .withMessage("Task priority is invalid"),
  body("type").not().exists().withMessage("Task type cannot be changed"),
  body("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be an ISO-8601 date"),
  body("dueDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("dueDate must be an ISO-8601 date"),
  body("date")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("date must be an ISO-8601 date"),
  body().custom((_, { req }) => {
    if (req.body?.startDate && req.body?.dueDate) {
      if (new Date(req.body.dueDate).getTime() <= new Date(req.body.startDate).getTime()) {
        throw new Error("dueDate must be after startDate");
      }
    }

    return true;
  }),
];

/**
 * Validators for `DELETE /api/tasks/:taskId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteTaskValidators = [...taskIdValidators];

/**
 * Validators for `PATCH /api/tasks/:taskId/restore`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreTaskValidators = [...taskIdValidators];

/**
 * Validators for `GET /api/tasks/:taskId/activities` and comments list filters.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const taskChildListValidators = [
  ...taskIdValidators,
  ...paginationValidators(),
  query("parentModel")
    .optional({ values: "falsy" })
    .isIn(TASK_PARENT_MODELS)
    .withMessage("parentModel is invalid"),
  query("parentId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("parentId must be a valid object id"),
];
