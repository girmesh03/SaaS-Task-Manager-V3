/**
 * @file Frontend constants mirrored from backend source of truth plus
 * client-specific layout/navigation constants.
 * @throws {never} Module initialization does not throw.
 */

export const APP_NAME = "TaskManager";

export const NODE_ENVS = {
  DEVELOPMENT: "development",
  TEST: "test",
  PRODUCTION: "production",
};

export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

/**
 * Backward-compatible alias retained for existing frontend imports.
 */
export const USER_ROLE = USER_ROLES;

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

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.TODO]: "To Do",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.PENDING]: "In Review",
  [TASK_STATUS.COMPLETED]: "Completed",
};

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: "Low",
  [TASK_PRIORITY.MEDIUM]: "Medium",
  [TASK_PRIORITY.HIGH]: "High",
  [TASK_PRIORITY.URGENT]: "Critical",
};

export const TASK_TYPE = {
  PROJECT: "ProjectTask",
  ASSIGNED: "AssignedTask",
  ROUTINE: "RoutineTask",
};

export const PHONE_REGEX = /^(\+251\d{9}|0\d{9})$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ATTACHMENT_EXTENSIONS = [
  ".svg",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".mp4",
  ".mp3",
];

export const CLOUDINARY_FILE_URL_REGEX =
  /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(image|video|raw)\/upload\/v\d+\/.+$/;

export const API_DEFAULTS = {
  SEARCH_DEBOUNCE_MS: 300,
  DEFAULT_SORT_ORDER: "desc",
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  SORT_BY: "createdAt",
  SORT_ORDER: "desc",
  SEARCH: "",
  INCLUDE_DELETED: false,
};

/**
 * Backward-compatible alias retained for existing frontend imports.
 */
export const DEFAULT_PAGINATION = {
  ...PAGINATION_DEFAULTS,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

export const COOKIE_DEFAULTS = {
  ACCESS_TOKEN_NAME: "accessToken",
  REFRESH_TOKEN_NAME: "refreshToken",
};

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED_ERROR: "UNAUTHENTICATED_ERROR",
  UNAUTHORIZED_ERROR: "UNAUTHORIZED_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  RATE_LIMITED_ERROR: "RATE_LIMITED_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const VIEW_MODE = {
  GRID: "grid",
  LIST: "list",
};

export const LAYOUT_DIMENSIONS = {
  APP_BAR_HEIGHT_REM: 4,
  APP_BAR_HEIGHT_PX: 64,
  DASHBOARD_DRAWER_WIDTH_PX: 280,
  PUBLIC_DRAWER_WIDTH_PX: 260,
  MOBILE_BOTTOM_NAV_HEIGHT_PX: 56,
  MOBILE_FAB_SIZE_PX: 56,
};

export const UI_PLACEHOLDERS = {
  TASK_BADGE_COUNT: 12,
  NOTIFICATION_BADGE_COUNT: 3,
};
