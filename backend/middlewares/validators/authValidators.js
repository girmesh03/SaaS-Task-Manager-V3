/**
 * @file Auth endpoint validators.
 */
import { body } from "express-validator";
import {
  EMAIL_REGEX,
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_NAME_REGEX,
  ORGANIZATION_SIZES,
  PERSON_NAME_REGEX,
  PHONE_REGEX,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";

const passwordValidator = (path, label) => {
  return body(path)
    .isString()
    .withMessage(`${label} must be a string`)
    .isLength({
      min: VALIDATION_LIMITS.USER.PASSWORD_MIN,
      max: VALIDATION_LIMITS.USER.PASSWORD_MAX,
    })
    .withMessage(`${label} must be between 8 and 128 characters`);
};

/**
 * Validators for `POST /api/auth/register`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const registerValidators = [
  body("termsAccepted").not().exists().withMessage("termsAccepted is not supported"),
  body("organization").isObject().withMessage("organization payload is required"),
  body("organization.name")
    .isString()
    .withMessage("Organization name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ORGANIZATION.NAME_MIN,
      max: VALIDATION_LIMITS.ORGANIZATION.NAME_MAX,
    })
    .withMessage("Organization name must be between 2 and 100 characters")
    .matches(ORGANIZATION_NAME_REGEX)
    .withMessage("Organization name format is invalid"),
  body("organization.email")
    .isString()
    .withMessage("Organization email is required")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.ORGANIZATION.EMAIL_MAX })
    .withMessage("Organization email cannot exceed 100 characters")
    .matches(EMAIL_REGEX)
    .withMessage("Organization email format is invalid"),
  body("organization.phone")
    .isString()
    .withMessage("Organization phone is required")
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Organization phone format is invalid"),
  body("organization.address")
    .isString()
    .withMessage("Organization address is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MIN,
      max: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MAX,
    })
    .withMessage("Organization address must be between 5 and 500 characters"),
  body("organization.industry")
    .isIn(ORGANIZATION_INDUSTRIES)
    .withMessage("Industry is invalid"),
  body("organization.size")
    .isIn(ORGANIZATION_SIZES)
    .withMessage("Organization size is invalid"),
  body("organization.description")
    .optional()
    .isString()
    .withMessage("Organization description must be a string")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.ORGANIZATION.DESCRIPTION_MAX })
    .withMessage("Organization description cannot exceed 1000 characters"),
  body("department").isObject().withMessage("department payload is required"),
  body("department.name")
    .isString()
    .withMessage("Department name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.DEPARTMENT.NAME_MIN,
      max: VALIDATION_LIMITS.DEPARTMENT.NAME_MAX,
    })
    .withMessage("Department name must be between 2 and 100 characters")
    .matches(ORGANIZATION_NAME_REGEX)
    .withMessage("Department name format is invalid"),
  body("department.description")
    .isString()
    .withMessage("Department description is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MIN,
      max: VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MAX,
    })
    .withMessage("Department description cannot exceed 500 characters"),
  body("user").isObject().withMessage("user payload is required"),
  body("user.firstName")
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
  body("user.lastName")
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
  body("user.position")
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
  body("user.email")
    .isString()
    .withMessage("User email is required")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.USER.EMAIL_MAX })
    .withMessage("User email cannot exceed 100 characters")
    .matches(EMAIL_REGEX)
    .withMessage("User email format is invalid"),
  passwordValidator("user.password", "Password"),
  body("user.confirmPassword")
    .isString()
    .withMessage("confirmPassword is required")
    .custom((value, { req }) => {
      if (value !== req.body?.user?.password) {
        throw new Error("Password confirmation does not match");
      }

      return true;
    }),
];

/**
 * Validators for `POST /api/auth/verify-email`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const verifyEmailValidators = [
  body("token")
    .isString()
    .withMessage("Verification token is required")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required"),
];

/**
 * Validators for `POST /api/auth/resend-verification`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const resendVerificationValidators = [
  body("email")
    .isString()
    .withMessage("Email is required")
    .trim()
    .matches(EMAIL_REGEX)
    .withMessage("Email format is invalid"),
];

/**
 * Validators for `POST /api/auth/login`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const loginValidators = [
  body("email")
    .isString()
    .withMessage("Email is required")
    .trim()
    .matches(EMAIL_REGEX)
    .withMessage("Email format is invalid"),
  passwordValidator("password", "Password"),
];

/**
 * Validators for `POST /api/auth/forgot-password`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const forgotPasswordValidators = [
  body("email")
    .isString()
    .withMessage("Email is required")
    .trim()
    .matches(EMAIL_REGEX)
    .withMessage("Email format is invalid"),
];

/**
 * Validators for `POST /api/auth/reset-password`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const resetPasswordValidators = [
  body("token")
    .isString()
    .withMessage("Reset token is required")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),
  passwordValidator("password", "Password"),
  body("confirmPassword")
    .isString()
    .withMessage("confirmPassword is required")
    .custom((value, { req }) => {
      if (value !== req.body?.password) {
        throw new Error("Password confirmation does not match");
      }

      return true;
    }),
];

/**
 * Validators for `POST /api/auth/change-password`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const changePasswordValidators = [
  passwordValidator("currentPassword", "Current password"),
  passwordValidator("newPassword", "New password"),
  body("confirmNewPassword")
    .isString()
    .withMessage("confirmNewPassword is required")
    .custom((value, { req }) => {
      if (value !== req.body?.newPassword) {
        throw new Error("New password confirmation does not match");
      }

      return true;
    }),
];
