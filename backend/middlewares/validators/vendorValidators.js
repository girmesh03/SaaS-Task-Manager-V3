/**
 * @file Vendor endpoint validators.
 */
import { body, param, query } from "express-validator";
import Task from "../../models/Task.js";
import Vendor from "../../models/Vendor.js";
import {
  EMAIL_REGEX,
  PHONE_REGEX,
  TASK_TYPE,
  VALIDATION_LIMITS,
  VENDOR_STATUS,
} from "../../utils/constants.js";
import {
  csvEnumQuery,
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const ensureVendorExists = async (value) => {
  const vendor = await Vendor.findById(value).withDeleted();
  if (!vendor) {
    throw new Error("Vendor not found");
  }

  return true;
};

const ensureVendorNotAssociated = async (value) => {
  const projectAssociation = await Task.findOne({
    type: TASK_TYPE.PROJECT,
    vendor: value,
  })
    .withDeleted()
    .select("_id");

  if (projectAssociation) {
    throw new Error("Vendor is associated with project tasks. Set status to INACTIVE instead.");
  }

  return true;
};

/**
 * Validators for `GET /api/vendors`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listVendorValidators = [
  ...paginationValidators(),
  query("organizationId")
    .optional()
    .isMongoId()
    .withMessage("organizationId must be a valid object id"),
  csvEnumQuery("status", Object.values(VENDOR_STATUS)),
  query("ratingMin")
    .optional()
    .isFloat({
      min: VALIDATION_LIMITS.VENDOR.RATING_MIN,
      max: VALIDATION_LIMITS.VENDOR.RATING_MAX,
    })
    .withMessage("ratingMin must be between 1 and 5"),
  query("ratingMax")
    .optional()
    .isFloat({
      min: VALIDATION_LIMITS.VENDOR.RATING_MIN,
      max: VALIDATION_LIMITS.VENDOR.RATING_MAX,
    })
    .withMessage("ratingMax must be between 1 and 5"),
  query("verifiedPartner")
    .optional()
    .isBoolean()
    .withMessage("verifiedPartner must be a boolean"),
  isoDateQuery("createdFrom"),
  isoDateQuery("createdTo"),
];

/**
 * Validators for `POST /api/vendors`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createVendorValidators = [
  body("name")
    .isString()
    .withMessage("Vendor name is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.VENDOR.NAME_MIN,
      max: VALIDATION_LIMITS.VENDOR.NAME_MAX,
    })
    .withMessage("Vendor name must be between 2 and 200 characters"),
  body("email")
    .isString()
    .withMessage("Vendor email is required")
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.EMAIL_MAX })
    .withMessage("Vendor email cannot exceed 100 characters")
    .matches(EMAIL_REGEX)
    .withMessage("Vendor email format is invalid"),
  body("phone")
    .isString()
    .withMessage("Vendor phone is required")
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Vendor phone format is invalid"),
  body("website")
    .optional({ values: "falsy" })
    .isURL()
    .withMessage("Vendor website must be a valid URL"),
  body("location")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.LOCATION_MAX })
    .withMessage("Vendor location cannot exceed 200 characters"),
  body("address")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.ADDRESS_MAX })
    .withMessage("Vendor address cannot exceed 500 characters"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.DESCRIPTION_MAX })
    .withMessage("Vendor description cannot exceed 1000 characters"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(VENDOR_STATUS))
    .withMessage("Vendor status is invalid"),
  body("isVerifiedPartner")
    .optional()
    .isBoolean()
    .withMessage("isVerifiedPartner must be a boolean"),
  body("rating")
    .optional({ values: "falsy" })
    .isFloat({
      min: VALIDATION_LIMITS.VENDOR.RATING_MIN,
      max: VALIDATION_LIMITS.VENDOR.RATING_MAX,
    })
    .withMessage("Vendor rating must be between 1 and 5")
    .custom((value) => {
      const parsed = Number(value);
      const rounded =
        Math.round(parsed / VALIDATION_LIMITS.VENDOR.RATING_STEP) *
        VALIDATION_LIMITS.VENDOR.RATING_STEP;
      if (parsed !== rounded) {
        throw new Error("Vendor rating must use 0.5 increments");
      }

      return true;
    }),
];

/**
 * Validators for `:vendorId` param.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const vendorIdValidators = [
  objectIdParam("vendorId"),
  param("vendorId").custom(ensureVendorExists),
];

/**
 * Validators for `PUT /api/vendors/:vendorId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const updateVendorValidators = [
  ...vendorIdValidators,
  body("name")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.VENDOR.NAME_MIN,
      max: VALIDATION_LIMITS.VENDOR.NAME_MAX,
    })
    .withMessage("Vendor name must be between 2 and 200 characters"),
  body("email")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.EMAIL_MAX })
    .matches(EMAIL_REGEX)
    .withMessage("Vendor email format is invalid"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Vendor phone format is invalid"),
  body("website")
    .optional({ values: "falsy" })
    .isURL()
    .withMessage("Vendor website must be a valid URL"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(VENDOR_STATUS))
    .withMessage("Vendor status is invalid"),
  body("isVerifiedPartner")
    .optional()
    .isBoolean()
    .withMessage("isVerifiedPartner must be a boolean"),
  body("rating")
    .optional({ values: "falsy" })
    .isFloat({
      min: VALIDATION_LIMITS.VENDOR.RATING_MIN,
      max: VALIDATION_LIMITS.VENDOR.RATING_MAX,
    })
    .withMessage("Vendor rating must be between 1 and 5")
    .custom((value) => {
      const parsed = Number(value);
      const rounded =
        Math.round(parsed / VALIDATION_LIMITS.VENDOR.RATING_STEP) *
        VALIDATION_LIMITS.VENDOR.RATING_STEP;
      if (parsed !== rounded) {
        throw new Error("Vendor rating must use 0.5 increments");
      }

      return true;
    }),
  body("location")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.LOCATION_MAX })
    .withMessage("Vendor location cannot exceed 200 characters"),
  body("address")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.ADDRESS_MAX })
    .withMessage("Vendor address cannot exceed 500 characters"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: VALIDATION_LIMITS.VENDOR.DESCRIPTION_MAX })
    .withMessage("Vendor description cannot exceed 1000 characters"),
];

/**
 * Validators for `POST /api/vendors/:vendorId/contact`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const contactVendorValidators = [
  ...vendorIdValidators,
  body("subject")
    .isString()
    .withMessage("subject is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.VENDOR.CONTACT_SUBJECT_MIN,
      max: VALIDATION_LIMITS.VENDOR.CONTACT_SUBJECT_MAX,
    })
    .withMessage("subject must be between 2 and 200 characters"),
  body("message")
    .isString()
    .withMessage("message is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.VENDOR.CONTACT_MESSAGE_MIN,
      max: VALIDATION_LIMITS.VENDOR.CONTACT_MESSAGE_MAX,
    })
    .withMessage("message must be between 2 and 5000 characters"),
  body("ccMe")
    .optional()
    .isBoolean()
    .withMessage("ccMe must be a boolean"),
];

/**
 * Validators for `DELETE /api/vendors/:vendorId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteVendorValidators = [
  ...vendorIdValidators,
  param("vendorId").custom(ensureVendorNotAssociated),
];

/**
 * Validators for `PATCH /api/vendors/:vendorId/restore`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreVendorValidators = [...vendorIdValidators];
