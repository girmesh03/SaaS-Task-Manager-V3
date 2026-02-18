/**
 * @file Task comment controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listTaskComments = createPlaceholderController("TaskComment", "listTaskComments");
export const createTaskComment = createPlaceholderController("TaskComment", "createTaskComment");
export const getTaskComment = createPlaceholderController("TaskComment", "getTaskComment");
export const updateTaskComment = createPlaceholderController("TaskComment", "updateTaskComment");
export const deleteTaskComment = createPlaceholderController("TaskComment", "deleteTaskComment");
export const restoreTaskComment = createPlaceholderController("TaskComment", "restoreTaskComment");

export default {
  listTaskComments,
  createTaskComment,
  getTaskComment,
  updateTaskComment,
  deleteTaskComment,
  restoreTaskComment,
};
