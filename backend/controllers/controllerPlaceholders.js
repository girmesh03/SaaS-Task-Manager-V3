/**
 * @file Shared placeholder-controller factory for scaffolded endpoints.
 */
import asyncHandler from "express-async-handler";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Builds a canonical placeholder controller for endpoints that are scaffolded in phase 2.
 *
 * @param {string} domain - Logical resource domain.
 * @param {string} action - Domain action name.
 * @param {{
 *   statusCode?: number;
 *   success?: boolean;
 *   message?: string | ((req: import("express").Request) => string);
 *   implementationPhase?: string;
 *   buildData?: ((req: import("express").Request) => Record<string, unknown> | null);
 * }} [options={}] - Placeholder response options.
 * @returns {import("express").RequestHandler} Express handler.
 * @throws {never} This helper does not throw.
 */
export const createPlaceholderController = (domain, action, options = {}) => {
  const statusCode = Number(options.statusCode || HTTP_STATUS.NOT_IMPLEMENTED);
  const isSuccessStatus = statusCode >= HTTP_STATUS.OK && statusCode < HTTP_STATUS.BAD_REQUEST;
  const success =
    typeof options.success === "boolean" ? options.success : isSuccessStatus;
  const defaultMessage = `${domain}.${action} is scaffolded in Phase 2 and will be implemented in a later phase`;
  const implementationPhase = options.implementationPhase || "PHASE_3_PLUS";

  return asyncHandler(async (req, res) => {
    const resolvedMessage =
      typeof options.message === "function"
        ? options.message(req)
        : options.message || defaultMessage;
    const responseData =
      typeof options.buildData === "function" ? options.buildData(req) : null;

    const payload = {
      success,
      message: resolvedMessage,
      meta: {
        domain,
        action,
        implementationPhase,
        placeholder: true,
      },
    };

    if (responseData !== null && responseData !== undefined) {
      payload.data = responseData;
    }

    if (!success) {
      payload.error = {
        code: "NOT_IMPLEMENTED",
        statusCode,
      };
    }

    res.status(statusCode).json(payload);
  });
};

export default createPlaceholderController;
