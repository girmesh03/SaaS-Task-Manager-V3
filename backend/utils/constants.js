/**
 * @file Backend canonical constants (phase 2 source of truth).
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

export const ORGANIZATION_SIZES = ["Small", "Medium", "Large"];

export const ORGANIZATION_INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Construction",
  "Hospitality",
  "Transportation",
  "Real Estate",
  "Agriculture",
  "Energy",
  "Telecommunications",
  "Media",
  "Entertainment",
  "Legal",
  "Consulting",
  "Insurance",
  "Automotive",
  "Aerospace",
  "Pharmaceutical",
  "Food & Beverage",
  "Government",
  "Non-Profit",
];

export const MATERIAL_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Hardware",
  "Cleaning",
  "Textiles",
  "Consumables",
  "Construction",
  "Other",
];

export const ATTACHMENT_FILE_TYPES = ["Image", "Video", "Document", "Audio", "Other"];

export const TASK_PARENT_MODELS = ["Task", "TaskActivity", "TaskComment"];

export const NOTIFICATION_ENTITY_MODELS = [
  "Task",
  "TaskActivity",
  "TaskComment",
  "User",
  "Organization",
  "Department",
  "Material",
  "Vendor",
];

export const PREFERENCE_THEME_MODES = ["LIGHT", "DARK", "SYSTEM"];
export const PREFERENCE_DATE_FORMATS = ["MDY", "DMY", "YMD"];
export const PREFERENCE_TIME_FORMATS = ["12H", "24H"];

export const PERFORMANCE_RANGES = [
  "LAST_7_DAYS",
  "LAST_30_DAYS",
  "LAST_6_MONTHS",
  "THIS_QUARTER",
];

export const PHONE_REGEX = /^(\+251\d{9}|0\d{9})$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ORGANIZATION_NAME_REGEX = /^[a-zA-Z0-9\s\-&.,'()]+$/;
export const PERSON_NAME_REGEX = /^[a-zA-Z\s\-']+$/;
export const SKU_REGEX = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
export const EMPLOYEE_ID_REGEX = /^(?!0000)\d{4}$/;

export const TIME_UNITS = {
  SECOND_MS: 1000,
  MINUTE_SECONDS: 60,
  HOUR_SECONDS: 60 * 60,
  DAY_SECONDS: 24 * 60 * 60,
  DAY_MS: 24 * 60 * 60 * 1000,
};

export const VALIDATION_LIMITS = {
  PAGINATION: {
    PAGE_MIN: 1,
    LIMIT_MIN: 1,
    LIMIT_MAX: 100,
  },
  ORGANIZATION: {
    NAME_MIN: 2,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 1000,
    EMAIL_MAX: 100,
    PHONE_MIN: 10,
    PHONE_MAX: 15,
    ADDRESS_MIN: 5,
    ADDRESS_MAX: 500,
    LOGO_PUBLIC_ID_MAX: 255,
  },
  DEPARTMENT: {
    NAME_MIN: 2,
    NAME_MAX: 100,
    DESCRIPTION_MIN: 1,
    DESCRIPTION_MAX: 500,
    MEMBER_COUNT_MIN: 0,
  },
  USER: {
    FIRST_NAME_MIN: 2,
    FIRST_NAME_MAX: 50,
    LAST_NAME_MIN: 2,
    LAST_NAME_MAX: 50,
    POSITION_MIN: 2,
    POSITION_MAX: 100,
    EMAIL_MAX: 100,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,
    PHONE_MIN: 10,
    PHONE_MAX: 15,
    EMPLOYEE_ID_LENGTH: 4,
    SKILLS_MAX: 10,
    SKILL_NAME_MAX: 50,
    SKILL_PERCENTAGE_MIN: 0,
    SKILL_PERCENTAGE_MAX: 100,
    PROFILE_PICTURE_PUBLIC_ID_MAX: 255,
  },
  TASK: {
    TITLE_MIN: 3,
    TITLE_MAX: 200,
    DESCRIPTION_MIN: 10,
    DESCRIPTION_MAX: 5000,
    TAGS_MAX: 5,
    TAG_MAX_LENGTH: 50,
    ASSIGNEES_MIN: 1,
    ASSIGNEES_MAX: 50,
    MATERIALS_MAX: 20,
    ATTACHMENTS_MAX: 20,
  },
  TASK_ACTIVITY: {
    ACTIVITY_MIN: 2,
    ACTIVITY_MAX: 1000,
    MATERIALS_MAX: 20,
    ATTACHMENTS_MAX: 20,
  },
  TASK_COMMENT: {
    COMMENT_MIN: 2,
    COMMENT_MAX: 2000,
    DEPTH_MIN: 0,
    DEPTH_MAX: 5,
    MENTIONS_MAX: 20,
  },
  MATERIAL: {
    NAME_MIN: 2,
    NAME_MAX: 200,
    SKU_MIN: 2,
    SKU_MAX: 30,
    DESCRIPTION_MAX: 1000,
    UNIT_MIN: 1,
    UNIT_MAX: 50,
    PRICE_MIN: 0,
    INVENTORY_MIN: 0,
    RESTOCK_NOTE_MAX: 500,
  },
  VENDOR: {
    NAME_MIN: 2,
    NAME_MAX: 200,
    EMAIL_MAX: 100,
    PHONE_MIN: 10,
    PHONE_MAX: 15,
    WEBSITE_MAX: 255,
    LOCATION_MAX: 200,
    ADDRESS_MAX: 500,
    DESCRIPTION_MAX: 1000,
    RATING_MIN: 1,
    RATING_MAX: 5,
    RATING_STEP: 0.5,
    CONTACT_SUBJECT_MIN: 2,
    CONTACT_SUBJECT_MAX: 200,
    CONTACT_MESSAGE_MIN: 2,
    CONTACT_MESSAGE_MAX: 5000,
  },
  ATTACHMENT: {
    FILE_NAME_MIN: 1,
    FILE_NAME_MAX: 255,
    FILE_SIZE_MIN: 0,
    FILE_SIZE_MAX_BYTES: 10 * 1024 * 1024,
  },
  NOTIFICATION: {
    TITLE_MAX: 200,
    MESSAGE_MIN: 1,
    MESSAGE_MAX: 500,
  },
};

export const SOFT_DELETE_TTL_DAYS = {
  ORGANIZATION: null,
  DEPARTMENT: 365,
  USER: 365,
  TASK: 180,
  TASK_COMMENT: 180,
  TASK_ACTIVITY: 90,
  MATERIAL: 90,
  VENDOR: 90,
  NOTIFICATION: 30,
  ATTACHMENT: 30,
};

export const SOFT_DELETE_TTL_SECONDS = {
  DEPARTMENT: SOFT_DELETE_TTL_DAYS.DEPARTMENT * TIME_UNITS.DAY_SECONDS,
  USER: SOFT_DELETE_TTL_DAYS.USER * TIME_UNITS.DAY_SECONDS,
  TASK: SOFT_DELETE_TTL_DAYS.TASK * TIME_UNITS.DAY_SECONDS,
  TASK_COMMENT: SOFT_DELETE_TTL_DAYS.TASK_COMMENT * TIME_UNITS.DAY_SECONDS,
  TASK_ACTIVITY: SOFT_DELETE_TTL_DAYS.TASK_ACTIVITY * TIME_UNITS.DAY_SECONDS,
  MATERIAL: SOFT_DELETE_TTL_DAYS.MATERIAL * TIME_UNITS.DAY_SECONDS,
  VENDOR: SOFT_DELETE_TTL_DAYS.VENDOR * TIME_UNITS.DAY_SECONDS,
  NOTIFICATION: SOFT_DELETE_TTL_DAYS.NOTIFICATION * TIME_UNITS.DAY_SECONDS,
  ATTACHMENT: SOFT_DELETE_TTL_DAYS.ATTACHMENT * TIME_UNITS.DAY_SECONDS,
};

export const NOTIFICATION_EXPIRY_MS =
  SOFT_DELETE_TTL_DAYS.NOTIFICATION * TIME_UNITS.DAY_MS;

export const MOCK_DEFAULTS = {
  PASSWORD: "12345678",
  GMAIL_DOMAIN: "gmail.com",
};

export const INDEX_DEFAULTS = {
  TTL_EXPIRE_AT_FIELD_SECONDS: 0,
};

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
  PAGE: VALIDATION_LIMITS.PAGINATION.PAGE_MIN,
  LIMIT: 20,
  MAX_LIMIT: VALIDATION_LIMITS.PAGINATION.LIMIT_MAX,
  SORT_BY: "createdAt",
  SORT_ORDER: "desc",
  SEARCH: "",
  INCLUDE_DELETED: false,
};

export const COOKIE_DEFAULTS = {
  ACCESS_TOKEN_NAME: "accessToken",
  REFRESH_TOKEN_NAME: "refreshToken",
};

export const RATE_LIMIT_PROFILES = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX: 20,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX: 300,
  },
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
  NOT_IMPLEMENTED: 501,
};

export const ENV_KEYS = {
  REQUIRED: [
    "NODE_ENV",
    "MONGO_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",
    "COOKIE_NAME_ACCESS",
    "COOKIE_NAME_REFRESH",
    "COOKIE_SECURE",
    "COOKIE_SAME_SITE",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_FROM",
    "CLIENT_ORIGIN",
    "CORS_ALLOWED_ORIGINS",
  ],
};

export const DEFAULT_HEALTH_RESPONSE = {
  success: true,
  status: "ok",
};

export const SOFT_DELETE_DEFAULTS = {
  IS_DELETED: false,
  DELETED_AT: null,
  DELETED_BY: null,
};

export const SOFT_DELETE_QUERY_OPTIONS = {
  WITH_DELETED: "withDeleted",
  ONLY_DELETED: "onlyDeleted",
};

export const BCRYPT_SALT_ROUNDS = 12;

export const USER_IMMUTABLE_FIELDS = [
  "department",
  "departmentId",
  "role",
  "employeeId",
  "joinedAt",
  "isHod",
];

export const ROUTE_RESOURCE_MAP = {
  AUTH: "Auth",
  USER: "User",
  DEPARTMENT: "Department",
  TASK: "Task",
  TASK_ACTIVITY: "TaskActivity",
  TASK_COMMENT: "TaskComment",
  MATERIAL: "Material",
  VENDOR: "Vendor",
  ATTACHMENT: "Attachment",
  NOTIFICATION: "Notification",
  DASHBOARD: "Dashboard",
};

export const DEFAULT_USER_PREFERENCES = {
  notifications: {
    browserEnabled: false,
    emailEnabled: true,
    inAppEnabled: true,
    emailEvents: {
      task: true,
      activity: true,
      comment: true,
      mention: true,
      user: true,
      material: true,
      vendor: true,
    },
    inAppEvents: {
      task: true,
      activity: true,
      comment: true,
      mention: true,
      user: true,
      material: true,
      vendor: true,
    },
  },
  appearance: {
    themeMode: "SYSTEM",
    language: "en",
    dateFormat: "MDY",
    timeFormat: "12H",
    timezone: "UTC",
  },
};

export const DEFAULT_USER_SECURITY = {
  twoFactorEnabled: false,
};
