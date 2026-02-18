/**
 * @file Canonical task route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createTaskValidators,
  deleteTaskValidators,
  listTaskValidators,
  restoreTaskValidators,
  taskIdValidators,
  updateTaskValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  restoreTask,
  updateTask,
} from "../controllers/taskController.js";

const router = Router();

router.get("/", requireAuth, validate(listTaskValidators), authorize("Task", "read"), listTasks);
router.post("/", requireAuth, validate(createTaskValidators), authorize("Task", "create"), createTask);
router.get("/:taskId", requireAuth, validate(taskIdValidators), authorize("Task", "read"), getTask);
router.put("/:taskId", requireAuth, validate(updateTaskValidators), authorize("Task", "update"), updateTask);
router.delete(
  "/:taskId",
  requireAuth,
  validate(deleteTaskValidators),
  authorize("Task", "delete"),
  deleteTask
);
router.patch(
  "/:taskId/restore",
  requireAuth,
  validate(restoreTaskValidators),
  authorize("Task", "delete"),
  restoreTask
);

export default router;
