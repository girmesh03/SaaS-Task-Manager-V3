/**
 * @file Task activity endpoint validators.
 */
import { body, param } from "express-validator";
import Task from "../../models/Task.js";
import TaskActivity from "../../models/TaskActivity.js";
import { TASK_PARENT_MODELS, VALIDATION_LIMITS } from "../../utils/constants.js";
import { objectIdParam } from "./shared.js";

const ensureTaskExists = async (value, { req }) => {
  const task = await Task.findById(value).withDeleted();
  if (!task) {
    throw new Error("Task not found");
  }

  req.authorizationTarget = task;
  return true;
};

const ensureActivityExists = async (value, { req }) => {
  const activity = await TaskActivity.findById(value).withDeleted();
  if (!activity) {
    throw new Error("Task activity not found");
  }

  req.authorizationTarget = activity;
  return true;
};

/**
 * Validators for common task/activity params.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const taskActivityPathValidators = [
  objectIdParam("taskId"),
  param("taskId").custom(ensureTaskExists),
  objectIdParam("activityId"),
  param("activityId").custom(ensureActivityExists),
];

/**
 * Validators for `POST /api/tasks/:taskId/activities`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createTaskActivityValidators = [
  objectIdParam("taskId"),
  param("taskId").custom(ensureTaskExists),
  body("activity")
    .isString()
    .withMessage("Activity description is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK_ACTIVITY.ACTIVITY_MIN,
      max: VALIDATION_LIMITS.TASK_ACTIVITY.ACTIVITY_MAX,
    })
    .withMessage("Activity description must be between 2 and 1000 characters"),
  body("parentModel")
    .optional({ values: "falsy" })
    .isIn(TASK_PARENT_MODELS)
    .withMessage("parentModel is invalid"),
  body("parentId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("parentId must be a valid object id"),
  body("materials")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.TASK_ACTIVITY.MATERIALS_MAX })
    .withMessage("materials cannot exceed 20 entries"),
  body("materials.*.materialId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("materials.materialId must be a valid object id"),
  body("materials.*.quantity")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.UNIT_MIN })
    .withMessage("materials.quantity must be greater than 0"),
  body("attachments")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.TASK_ACTIVITY.ATTACHMENTS_MAX })
    .withMessage("attachments cannot exceed 20 entries"),
  body("attachments.*")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("attachment ids must be valid object ids"),
];

/**
 * Validators for `PUT /api/tasks/:taskId/activities/:activityId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateTaskActivityValidators = [
  ...taskActivityPathValidators,
  body("activity")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK_ACTIVITY.ACTIVITY_MIN,
      max: VALIDATION_LIMITS.TASK_ACTIVITY.ACTIVITY_MAX,
    })
    .withMessage("Activity description must be between 2 and 1000 characters"),
  body("materials")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.TASK_ACTIVITY.MATERIALS_MAX })
    .withMessage("materials cannot exceed 20 entries"),
  body("materials.*.materialId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("materials.materialId must be a valid object id"),
  body("materials.*.quantity")
    .optional({ values: "falsy" })
    .isFloat({ min: VALIDATION_LIMITS.MATERIAL.UNIT_MIN })
    .withMessage("materials.quantity must be greater than 0"),
];

/**
 * Validators for reading/deleting/restoring single task activity.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const taskActivityByIdValidators = [...taskActivityPathValidators];
