/**
 * @file Task activity controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listTaskActivities = createPlaceholderController("TaskActivity", "listTaskActivities");
export const createTaskActivity = createPlaceholderController("TaskActivity", "createTaskActivity");
export const getTaskActivity = createPlaceholderController("TaskActivity", "getTaskActivity");
export const updateTaskActivity = createPlaceholderController("TaskActivity", "updateTaskActivity");
export const deleteTaskActivity = createPlaceholderController("TaskActivity", "deleteTaskActivity");
export const restoreTaskActivity = createPlaceholderController("TaskActivity", "restoreTaskActivity");

export default {
  listTaskActivities,
  createTaskActivity,
  getTaskActivity,
  updateTaskActivity,
  deleteTaskActivity,
  restoreTaskActivity,
};
