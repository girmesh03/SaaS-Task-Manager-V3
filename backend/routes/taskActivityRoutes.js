/**
 * @file Canonical task activity route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createTaskActivityValidators,
  taskActivityByIdValidators,
  taskChildListValidators,
  updateTaskActivityValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createTaskActivity,
  deleteTaskActivity,
  getTaskActivity,
  listTaskActivities,
  restoreTaskActivity,
  updateTaskActivity,
} from "../controllers/taskActivityController.js";

const router = Router();

router.get(
  "/:taskId/activities",
  requireAuth,
  validate(taskChildListValidators),
  authorize("TaskActivity", "read"),
  listTaskActivities
);
router.post(
  "/:taskId/activities",
  requireAuth,
  validate(createTaskActivityValidators),
  authorize("TaskActivity", "create"),
  createTaskActivity
);
router.get(
  "/:taskId/activities/:activityId",
  requireAuth,
  validate(taskActivityByIdValidators),
  authorize("TaskActivity", "read"),
  getTaskActivity
);
router.put(
  "/:taskId/activities/:activityId",
  requireAuth,
  validate(updateTaskActivityValidators),
  authorize("TaskActivity", "update"),
  updateTaskActivity
);
router.delete(
  "/:taskId/activities/:activityId",
  requireAuth,
  validate(taskActivityByIdValidators),
  authorize("TaskActivity", "delete"),
  deleteTaskActivity
);
router.patch(
  "/:taskId/activities/:activityId/restore",
  requireAuth,
  validate(taskActivityByIdValidators),
  authorize("TaskActivity", "delete"),
  restoreTaskActivity
);

export default router;
