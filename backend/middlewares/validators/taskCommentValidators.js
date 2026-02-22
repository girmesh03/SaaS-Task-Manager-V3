/**
 * @file Task comment endpoint validators.
 */
import { body, param } from "express-validator";
import Task from "../../models/Task.js";
import TaskComment from "../../models/TaskComment.js";
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

const ensureCommentExists = async (value, { req }) => {
  const comment = await TaskComment.findById(value).withDeleted();
  if (!comment) {
    throw new Error("Task comment not found");
  }

  req.authorizationTarget = comment;
  return true;
};

/**
 * Validators for common task/comment params.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const taskCommentPathValidators = [
  objectIdParam("taskId"),
  param("taskId").custom(ensureTaskExists),
  objectIdParam("commentId"),
  param("commentId").custom(ensureCommentExists),
];

/**
 * Validators for `POST /api/tasks/:taskId/comments`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createTaskCommentValidators = [
  objectIdParam("taskId"),
  param("taskId").custom(ensureTaskExists),
  body("comment")
    .isString()
    .withMessage("Comment content is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK_COMMENT.COMMENT_MIN,
      max: VALIDATION_LIMITS.TASK_COMMENT.COMMENT_MAX,
    })
    .withMessage("Comment content must be between 2 and 2000 characters"),
  body("parentModel")
    .optional({ values: "falsy" })
    .isIn(TASK_PARENT_MODELS)
    .withMessage("parentModel is invalid"),
  body("parentId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("parentId must be a valid object id"),
];

/**
 * Validators for `PUT /api/tasks/:taskId/comments/:commentId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateTaskCommentValidators = [
  ...taskCommentPathValidators,
  body("comment")
    .isString()
    .withMessage("Comment content is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.TASK_COMMENT.COMMENT_MIN,
      max: VALIDATION_LIMITS.TASK_COMMENT.COMMENT_MAX,
    })
    .withMessage("Comment content must be between 2 and 2000 characters"),
];

/**
 * Validators for reading/deleting/restoring single task comment.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const taskCommentByIdValidators = [...taskCommentPathValidators];
