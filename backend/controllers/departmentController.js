/**
 * @file Department controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listDepartments = createPlaceholderController("Department", "listDepartments");
export const createDepartment = createPlaceholderController("Department", "createDepartment");
export const getDepartment = createPlaceholderController("Department", "getDepartment");
export const getDepartmentActivity = createPlaceholderController("Department", "getDepartmentActivity");
export const getDepartmentDashboard = createPlaceholderController("Department", "getDepartmentDashboard");
export const updateDepartment = createPlaceholderController("Department", "updateDepartment");
export const deleteDepartment = createPlaceholderController("Department", "deleteDepartment");
export const restoreDepartment = createPlaceholderController("Department", "restoreDepartment");

export default {
  listDepartments,
  createDepartment,
  getDepartment,
  getDepartmentActivity,
  getDepartmentDashboard,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
};
