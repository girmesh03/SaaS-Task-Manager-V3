/**
 * @file User controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listUsers = createPlaceholderController("User", "listUsers");
export const createUser = createPlaceholderController("User", "createUser");
export const getUser = createPlaceholderController("User", "getUser");
export const getUserActivity = createPlaceholderController("User", "getUserActivity");
export const getUserPerformance = createPlaceholderController("User", "getUserPerformance");
export const updateUser = createPlaceholderController("User", "updateUser");
export const updateUserPreferences = createPlaceholderController("User", "updateUserPreferences");
export const updateUserSecurity = createPlaceholderController("User", "updateUserSecurity");
export const deleteUser = createPlaceholderController("User", "deleteUser");
export const restoreUser = createPlaceholderController("User", "restoreUser");

export default {
  listUsers,
  createUser,
  getUser,
  getUserActivity,
  getUserPerformance,
  updateUser,
  updateUserPreferences,
  updateUserSecurity,
  deleteUser,
  restoreUser,
};
