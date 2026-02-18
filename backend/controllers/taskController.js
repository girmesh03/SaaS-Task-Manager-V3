/**
 * @file Task controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listTasks = createPlaceholderController("Task", "listTasks");
export const createTask = createPlaceholderController("Task", "createTask");
export const getTask = createPlaceholderController("Task", "getTask");
export const updateTask = createPlaceholderController("Task", "updateTask");
export const deleteTask = createPlaceholderController("Task", "deleteTask");
export const restoreTask = createPlaceholderController("Task", "restoreTask");

export default {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  restoreTask,
};
