/**
 * @file Organization endpoint validators.
 */
import { body, param, query } from "express-validator";
import Organization from "../../models/Organization.js";
import {
  EMAIL_REGEX,
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_NAME_REGEX,
  ORGANIZATION_SIZES,
  PHONE_REGEX,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";
import { paginationValidators, objectIdParam } from "./shared.js";

const ensureOrganizationExists = async (value) => {
  const organization = await Organization.findById(value).withDeleted();
  if (!organization) {
    throw new Error("Organization not found");
  }

  return true;
};

/**
 * Validators for organization list routes.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listOrganizationValidators = [
  ...paginationValidators(),
  query("isPlatformOrg")
    .optional()
    .isBoolean()
    .withMessage("isPlatformOrg must be a boolean"),
  query("isVerified")
    .optional()
    .isBoolean()
    .withMessage("isVerified must be a boolean"),
];

/**
 * Validators for organization create routes.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createOrganizationValidators = [
  body("name")
    .isString()
    .withMessage("Organization name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ORGANIZATION.NAME_MIN,
      max: VALIDATION_LIMITS.ORGANIZATION.NAME_MAX,
    })
    .matches(ORGANIZATION_NAME_REGEX)
    .withMessage("Organization name format is invalid"),
  body("email")
    .isString()
    .withMessage("Organization email is required")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.ORGANIZATION.EMAIL_MAX })
    .matches(EMAIL_REGEX)
    .withMessage("Organization email format is invalid"),
  body("phone")
    .isString()
    .withMessage("Organization phone is required")
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Organization phone format is invalid"),
  body("address")
    .isString()
    .withMessage("Organization address is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MIN,
      max: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MAX,
    })
    .withMessage("Organization address must be between 5 and 500 characters"),
  body("industry")
    .isIn(ORGANIZATION_INDUSTRIES)
    .withMessage("Organization industry is invalid"),
  body("size")
    .isIn(ORGANIZATION_SIZES)
    .withMessage("Organization size is invalid"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.ORGANIZATION.DESCRIPTION_MAX })
    .withMessage("Organization description cannot exceed 1000 characters"),
];

/**
 * Validators for common `:organizationId` path parameters.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const organizationIdValidators = [
  objectIdParam("organizationId"),
  param("organizationId").custom(ensureOrganizationExists),
];

/**
 * Validators for organization update routes.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateOrganizationValidators = [
  ...organizationIdValidators,
  body("name")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ORGANIZATION.NAME_MIN,
      max: VALIDATION_LIMITS.ORGANIZATION.NAME_MAX,
    })
    .matches(ORGANIZATION_NAME_REGEX)
    .withMessage("Organization name format is invalid"),
  body("email")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.ORGANIZATION.EMAIL_MAX })
    .matches(EMAIL_REGEX)
    .withMessage("Organization email format is invalid"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Organization phone format is invalid"),
  body("address")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MIN,
      max: VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MAX,
    })
    .withMessage("Organization address must be between 5 and 500 characters"),
  body("industry")
    .optional({ values: "falsy" })
    .isIn(ORGANIZATION_INDUSTRIES)
    .withMessage("Organization industry is invalid"),
  body("size")
    .optional({ values: "falsy" })
    .isIn(ORGANIZATION_SIZES)
    .withMessage("Organization size is invalid"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.ORGANIZATION.DESCRIPTION_MAX })
    .withMessage("Organization description cannot exceed 1000 characters"),
];

/**
 * Validators for organization delete routes.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteOrganizationValidators = [...organizationIdValidators];

/**
 * Validators for organization restore routes.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreOrganizationValidators = [...organizationIdValidators];
