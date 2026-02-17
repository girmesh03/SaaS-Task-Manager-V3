/**
 * @file Express-validator execution helpers.
 */
import { matchedData, validationResult } from "express-validator";
import { ValidationError } from "../utils/errors.js";

const collectValidationErrors = (req) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return null;
  }

  return result.array({ onlyFirstError: true }).map((issue) => ({
    field: issue.path,
    message: issue.msg,
    value: issue.value,
  }));
};

/**
 * Executes all validators against a request and attaches normalized data to `req.validated`.
 *
 * @param {import("express-validator").ValidationChain[]} [validators=[]] - Validation chains.
 * @param {import("express").Request & { validated?: unknown }} req - Express request object.
 * @returns {Promise<{ body: Record<string, unknown>; params: Record<string, unknown>; query: Record<string, unknown> }>} Validated payload object.
 * @throws {ValidationError} Throws when validation errors are found.
 */
export const runValidation = async (validators = [], req) => {
  for (const validator of validators) {
    await validator.run(req);
  }

  const details = collectValidationErrors(req);
  if (details) {
    throw new ValidationError("Request validation failed", details);
  }

  req.validated = {
    body: matchedData(req, { locations: ["body"] }),
    params: matchedData(req, { locations: ["params"] }),
    query: matchedData(req, { locations: ["query"] }),
  };

  return req.validated;
};

/**
 * Creates validation middleware for a validation-chain set.
 *
 * @param {import("express-validator").ValidationChain[]} [validators=[]] - Validation chains.
 * @returns {import("express").RequestHandler} Express middleware function.
 * @throws {never} Validation failures are forwarded through `next`.
 */
export const validate = (validators = []) => {
  return async (req, _res, next) => {
    try {
      await runValidation(validators, req);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
