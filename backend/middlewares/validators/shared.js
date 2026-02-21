/**
 * @file Shared express-validator helpers.
 */
import mongoose from "mongoose";
import { query, param } from "express-validator";
import { VALIDATION_LIMITS } from "../../utils/constants.js";

const { isValidObjectId } = mongoose;

const parseCsv = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

/**
 * Returns common pagination and sorting query validators.
 *
 * @returns {import("express-validator").ValidationChain[]} Validation chains.
 * @throws {never} This helper does not throw.
 */
export const paginationValidators = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: VALIDATION_LIMITS.PAGINATION.PAGE_MIN })
      .withMessage("page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({
        min: VALIDATION_LIMITS.PAGINATION.LIMIT_MIN,
        max: VALIDATION_LIMITS.PAGINATION.LIMIT_MAX,
      })
      .withMessage("limit must be an integer between 1 and 100"),
    query("sortBy").optional().isString().trim(),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("sortOrder must be asc or desc"),
    query("includeDeleted")
      .optional()
      .isBoolean()
      .withMessage("includeDeleted must be a boolean"),
  ];
};

/**
 * Creates an optional CSV enum validator for a query key.
 *
 * @param {string} key - Query parameter key.
 * @param {string[]} allowedValues - Allowed enum values.
 * @returns {import("express-validator").ValidationChain} Validation chain.
 * @throws {never} This helper does not throw.
 */
export const csvEnumQuery = (key, allowedValues) => {
  return query(key)
    .optional()
    .custom((value) => {
      const parts = parseCsv(value);
      if (parts.length === 0) {
        return true;
      }

      const invalid = parts.filter((item) => !allowedValues.includes(item));
      if (invalid.length > 0) {
        throw new Error(`${key} contains invalid values: ${invalid.join(", ")}`);
      }

      return true;
    });
};

/**
 * Creates an optional CSV ObjectId validator for a query key.
 *
 * @param {string} key - Query parameter key.
 * @returns {import("express-validator").ValidationChain} Validation chain.
 * @throws {never} This helper does not throw.
 */
export const csvObjectIdQuery = (key) => {
  return query(key)
    .optional()
    .custom((value) => {
      const parts = parseCsv(value);
      if (parts.length === 0) {
        return true;
      }

      const invalid = parts.filter((item) => !isValidObjectId(item));
      if (invalid.length > 0) {
        throw new Error(`${key} contains invalid object ids`);
      }

      return true;
    });
};

/**
 * Creates an optional ISO date validator for a query key.
 *
 * @param {string} key - Query parameter key.
 * @returns {import("express-validator").ValidationChain} Validation chain.
 * @throws {never} This helper does not throw.
 */
export const isoDateQuery = (key) => {
  return query(key).optional().isISO8601().withMessage(`${key} must be an ISO-8601 date`);
};

/**
 * Creates a required ObjectId route-param validator.
 *
 * @param {string} key - Param key.
 * @returns {import("express-validator").ValidationChain} Validation chain.
 * @throws {never} This helper does not throw.
 */
export const objectIdParam = (key) => {
  return param(key).isMongoId().withMessage(`${key} must be a valid object id`);
};

/**
 * Parses a comma-separated string into a normalized array.
 *
 * @param {unknown} value - Raw query value.
 * @returns {string[]} Parsed string array.
 * @throws {never} This helper does not throw.
 */
export const parseCsvList = (value) => parseCsv(value);

/**
 * Checks if value is a valid MongoDB ObjectId.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} True when valid object id.
 * @throws {never} This helper does not throw.
 */
export const isObjectId = (value) => isValidObjectId(value);
