/**
 * @file User endpoint validators.
 */
import { body, param, query } from "express-validator";
import Department from "../../models/Department.js";
import User from "../../models/User.js";
import {
  EMAIL_REGEX,
  EMPLOYEE_ID_REGEX,
  PERFORMANCE_RANGES,
  PERSON_NAME_REGEX,
  PHONE_REGEX,
  PREFERENCE_DATE_FORMATS,
  PREFERENCE_THEME_MODES,
  PREFERENCE_TIME_FORMATS,
  USER_IMMUTABLE_FIELDS,
  USER_ROLES,
  USER_STATUS,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";
import {
  csvEnumQuery,
  csvObjectIdQuery,
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const ensureUserExists = async (value) => {
  const record = await User.findById(value).withDeleted();
  if (!record) {
    throw new Error("User not found");
  }

  return true;
};

const ensureDepartmentExists = async (value) => {
  if (!value) {
    return true;
  }

  const record = await Department.findById(value).withDeleted();
  if (!record) {
    throw new Error("Department not found");
  }

  return true;
};

/**
 * Validators for `GET /api/users`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listUsersValidators = [
  ...paginationValidators(),
  query("organizationId")
    .optional()
    .isMongoId()
    .withMessage("organizationId must be a valid object id"),
  csvObjectIdQuery("departmentId"),
  csvEnumQuery("role", Object.values(USER_ROLES)),
  csvEnumQuery("status", Object.values(USER_STATUS)),
  isoDateQuery("joinedFrom"),
  isoDateQuery("joinedTo"),
  query("employeeId")
    .optional()
    .matches(EMPLOYEE_ID_REGEX)
    .withMessage("employeeId must match 4-digit pattern"),
  query("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive must be a boolean"),
];

/**
 * Validators for `POST /api/users`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createUserValidators = [
  body("firstName")
    .isString()
    .withMessage("First name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.USER.FIRST_NAME_MIN,
      max: VALIDATION_LIMITS.USER.FIRST_NAME_MAX,
    })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(PERSON_NAME_REGEX)
    .withMessage("First name format is invalid"),
  body("lastName")
    .isString()
    .withMessage("Last name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.USER.LAST_NAME_MIN,
      max: VALIDATION_LIMITS.USER.LAST_NAME_MAX,
    })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(PERSON_NAME_REGEX)
    .withMessage("Last name format is invalid"),
  body("position")
    .isString()
    .withMessage("Position is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.USER.POSITION_MIN,
      max: VALIDATION_LIMITS.USER.POSITION_MAX,
    })
    .withMessage("Position must be between 2 and 100 characters")
    .matches(PERSON_NAME_REGEX)
    .withMessage("Position format is invalid"),
  body("email")
    .isString()
    .withMessage("Email is required")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.USER.EMAIL_MAX })
    .withMessage("Email cannot exceed 100 characters")
    .matches(EMAIL_REGEX)
    .withMessage("Email format is invalid"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a string")
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Phone format is invalid"),
  body("password")
    .isString()
    .withMessage("Password is required")
    .isLength({
      min: VALIDATION_LIMITS.USER.PASSWORD_MIN,
      max: VALIDATION_LIMITS.USER.PASSWORD_MAX,
    })
    .withMessage("Password must be between 8 and 128 characters"),
  body("role")
    .isIn(Object.values(USER_ROLES))
    .withMessage("Role is invalid"),
  body("departmentId")
    .isMongoId()
    .withMessage("departmentId must be a valid object id")
    .bail()
    .custom(ensureDepartmentExists),
  body("isHod")
    .optional()
    .isBoolean()
    .withMessage("isHod must be a boolean"),
  body("dateOfBirth")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("dateOfBirth must be an ISO-8601 date"),
  body("joinedAt")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("joinedAt must be an ISO-8601 date"),
  body("employeeId")
    .optional({ values: "falsy" })
    .matches(EMPLOYEE_ID_REGEX)
    .withMessage("employeeId must match 4-digit pattern"),
  body("skills")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.USER.SKILLS_MAX })
    .withMessage("skills cannot contain more than 10 entries"),
  body("skills.*.skill")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("skills.skill must be a string")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.USER.SKILL_NAME_MAX })
    .withMessage("skills.skill cannot exceed 50 characters"),
  body("skills.*.percentage")
    .optional({ values: "falsy" })
    .isFloat({
      min: VALIDATION_LIMITS.USER.SKILL_PERCENTAGE_MIN,
      max: VALIDATION_LIMITS.USER.SKILL_PERCENTAGE_MAX,
    })
    .withMessage("skills.percentage must be between 0 and 100"),
];

/**
 * Validators for common user-id path parameters.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const userIdValidators = [
  objectIdParam("userId"),
  param("userId").custom(ensureUserExists),
];

/**
 * Validators for `PUT /api/users/:userId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateUserValidators = [
  ...userIdValidators,
  body("firstName")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.USER.FIRST_NAME_MIN,
      max: VALIDATION_LIMITS.USER.FIRST_NAME_MAX,
    })
    .matches(PERSON_NAME_REGEX)
    .withMessage("firstName format is invalid"),
  body("lastName")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.USER.LAST_NAME_MIN,
      max: VALIDATION_LIMITS.USER.LAST_NAME_MAX,
    })
    .matches(PERSON_NAME_REGEX)
    .withMessage("lastName format is invalid"),
  body("position")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.USER.POSITION_MIN,
      max: VALIDATION_LIMITS.USER.POSITION_MAX,
    })
    .matches(PERSON_NAME_REGEX)
    .withMessage("position format is invalid"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Phone format is invalid"),
  body("email")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.USER.EMAIL_MAX })
    .matches(EMAIL_REGEX)
    .withMessage("Email format is invalid"),
  body("status")
    .optional()
    .isIn(Object.values(USER_STATUS))
    .withMessage("User status is invalid"),
  body("departmentId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("departmentId must be a valid object id")
    .bail()
    .custom(ensureDepartmentExists),
  body("role")
    .optional({ values: "falsy" })
    .isIn(Object.values(USER_ROLES))
    .withMessage("Role is invalid"),
  body("employeeId")
    .optional({ values: "falsy" })
    .matches(EMPLOYEE_ID_REGEX)
    .withMessage("employeeId must match 4-digit pattern"),
  body("joinedAt")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("joinedAt must be an ISO-8601 date"),
  body("isHod")
    .optional()
    .isBoolean()
    .withMessage("isHod must be a boolean"),
  body("skills")
    .optional()
    .isArray({ max: VALIDATION_LIMITS.USER.SKILLS_MAX })
    .withMessage("skills cannot contain more than 10 entries"),
  body().custom(async (_value, { req }) => {
    const immutablePayloadKeys = USER_IMMUTABLE_FIELDS.filter((field) => {
      return Object.prototype.hasOwnProperty.call(req.body || {}, field);
    });

    if (immutablePayloadKeys.length === 0) {
      return true;
    }

    const target = await User.findById(req.params.userId).withDeleted().select("role");
    if (!target) {
      throw new Error("User not found");
    }

    if ([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.USER].includes(target.role)) {
      throw new Error(
        `Immutable field update is not allowed for target role ${target.role}: ${immutablePayloadKeys.join(", ")}`
      );
    }

    return true;
  }),
];

/**
 * Validators for `PUT /api/users/:userId/preferences`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateUserPreferencesValidators = [
  ...userIdValidators,
  body("preferences").isObject().withMessage("preferences payload is required"),
  body("preferences.notifications.browserEnabled")
    .optional()
    .isBoolean()
    .withMessage("browserEnabled must be a boolean"),
  body("preferences.notifications.emailEnabled")
    .optional()
    .isBoolean()
    .withMessage("emailEnabled must be a boolean"),
  body("preferences.notifications.inAppEnabled")
    .optional()
    .isBoolean()
    .withMessage("inAppEnabled must be a boolean"),
  body("preferences.appearance.themeMode")
    .optional({ values: "falsy" })
    .isIn(PREFERENCE_THEME_MODES)
    .withMessage("themeMode is invalid"),
  body("preferences.appearance.dateFormat")
    .optional({ values: "falsy" })
    .isIn(PREFERENCE_DATE_FORMATS)
    .withMessage("dateFormat is invalid"),
  body("preferences.appearance.timeFormat")
    .optional({ values: "falsy" })
    .isIn(PREFERENCE_TIME_FORMATS)
    .withMessage("timeFormat is invalid"),
  body("preferences.appearance.timezone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("timezone must be a string"),
];

/**
 * Validators for `PUT /api/users/:userId/security`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateUserSecurityValidators = [
  ...userIdValidators,
  body("security").isObject().withMessage("security payload is required"),
  body("security.twoFactorEnabled")
    .optional()
    .isBoolean()
    .withMessage("twoFactorEnabled must be a boolean"),
];

/**
 * Validators for `GET /api/users/:userId/activity`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const userActivityValidators = [
  ...userIdValidators,
  ...paginationValidators(),
  query("entityModel").optional().isString().trim(),
  isoDateQuery("from"),
  isoDateQuery("to"),
];

/**
 * Validators for `GET /api/users/:userId/performance`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const userPerformanceValidators = [
  ...userIdValidators,
  query("range")
    .optional({ values: "falsy" })
    .isIn(PERFORMANCE_RANGES)
    .withMessage("Performance range is invalid"),
];

/**
 * Validators for `DELETE /api/users/:userId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteUserValidators = [...userIdValidators];

/**
 * Validators for `PATCH /api/users/:userId/restore`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreUserValidators = [...userIdValidators];
