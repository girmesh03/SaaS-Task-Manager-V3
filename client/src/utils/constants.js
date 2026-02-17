export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
};

export const TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export const TASK_TYPE = {
  PROJECT: "ProjectTask",
  ASSIGNED: "AssignedTask",
  ROUTINE: "RoutineTask",
};

export const USER_ROLE = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const DEPARTMENT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const MATERIAL_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const VENDOR_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const VIEW_MODE = {
  GRID: "grid",
  LIST: "list",
};

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

export const API_DEFAULTS = {
  DEBOUNCE_MS: 300,
};

export const PHONE_REGEX = /^(\+251\d{9}|0\d{9})$/;
