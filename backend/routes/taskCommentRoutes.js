/**
 * @file Canonical task comment route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createTaskCommentValidators,
  taskChildListValidators,
  taskCommentByIdValidators,
  updateTaskCommentValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComment,
  listTaskComments,
  restoreTaskComment,
  updateTaskComment,
} from "../controllers/taskCommentController.js";

const router = Router();

router.get(
  "/:taskId/comments",
  requireAuth,
  validate(taskChildListValidators),
  authorize("TaskComment", "read"),
  listTaskComments
);
router.post(
  "/:taskId/comments",
  requireAuth,
  validate(createTaskCommentValidators),
  authorize("TaskComment", "create"),
  createTaskComment
);
router.get(
  "/:taskId/comments/:commentId",
  requireAuth,
  validate(taskCommentByIdValidators),
  authorize("TaskComment", "read"),
  getTaskComment
);
router.put(
  "/:taskId/comments/:commentId",
  requireAuth,
  validate(updateTaskCommentValidators),
  authorize("TaskComment", "update"),
  updateTaskComment
);
router.delete(
  "/:taskId/comments/:commentId",
  requireAuth,
  validate(taskCommentByIdValidators),
  authorize("TaskComment", "delete"),
  deleteTaskComment
);
router.patch(
  "/:taskId/comments/:commentId/restore",
  requireAuth,
  validate(taskCommentByIdValidators),
  authorize("TaskComment", "delete"),
  restoreTaskComment
);

export default router;
