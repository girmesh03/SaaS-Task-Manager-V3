/**
 * @file Attachment endpoint validators.
 */
import { body, param } from "express-validator";
import path from "node:path";
import Attachment from "../../models/Attachment.js";
import Task from "../../models/Task.js";
import TaskActivity from "../../models/TaskActivity.js";
import TaskComment from "../../models/TaskComment.js";
import {
  ATTACHMENT_EXTENSIONS,
  ATTACHMENT_FILE_TYPES,
  CLOUDINARY_FILE_URL_REGEX,
  TASK_PARENT_MODELS,
  VALIDATION_LIMITS,
} from "../../utils/constants.js";
import { objectIdParam } from "./shared.js";

const parentModelMap = {
  Task,
  TaskActivity,
  TaskComment,
};

const ensureAttachmentExists = async (value, { req }) => {
  const attachment = await Attachment.findById(value).withDeleted();
  if (!attachment) {
    throw new Error("Attachment not found");
  }

  req.authorizationTarget = attachment;
  return true;
};

const ensureParentExists = async (_value, { req }) => {
  const parentModel = req.body?.parentModel;
  const parentId = req.body?.parent;

  const Model = parentModelMap[parentModel];
  if (!Model) {
    throw new Error("Attachment parentModel is invalid");
  }

  const record = await Model.findById(parentId).withDeleted();
  if (!record) {
    throw new Error("Attachment parent not found");
  }

  req.authorizationTarget = record;
  return true;
};

const validateExtensionAgainstAllowList = (fileName = "") => {
  const extension = path.extname(String(fileName).toLowerCase());
  if (!extension) {
    return false;
  }

  return ATTACHMENT_EXTENSIONS.includes(extension);
};

/**
 * Validators for `POST /api/attachments`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const createAttachmentValidators = [
  body("filename")
    .isString()
    .withMessage("filename is required")
    .trim()
    .isLength({
      min: VALIDATION_LIMITS.ATTACHMENT.FILE_NAME_MIN,
      max: VALIDATION_LIMITS.ATTACHMENT.FILE_NAME_MAX,
    })
    .withMessage("filename must be between 1 and 255 characters")
    .custom((value) => {
      if (!validateExtensionAgainstAllowList(value)) {
        throw new Error("filename extension is not allowed");
      }

      return true;
    }),
  body("fileUrl")
    .isString()
    .withMessage("fileUrl is required")
    .trim()
    .matches(CLOUDINARY_FILE_URL_REGEX)
    .withMessage("fileUrl must match Cloudinary URL format"),
  body("fileType")
    .isIn(ATTACHMENT_FILE_TYPES)
    .withMessage("fileType is invalid"),
  body("fileSize")
    .isInt({
      min: VALIDATION_LIMITS.ATTACHMENT.FILE_SIZE_MIN,
      max: VALIDATION_LIMITS.ATTACHMENT.FILE_SIZE_MAX_BYTES,
    })
    .withMessage("fileSize must be between 0 and 10MB"),
  body("parent")
    .isMongoId()
    .withMessage("parent must be a valid object id")
    .bail()
    .custom(ensureParentExists),
  body("parentModel")
    .isIn(TASK_PARENT_MODELS)
    .withMessage("parentModel is invalid"),
];

/**
 * Validators for `:attachmentId` path parameter.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const attachmentIdValidators = [
  objectIdParam("attachmentId"),
  param("attachmentId").custom(ensureAttachmentExists),
];

/**
 * Validators for `DELETE /api/attachments/:attachmentId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteAttachmentValidators = [...attachmentIdValidators];

/**
 * Validators for `PATCH /api/attachments/:attachmentId/restore`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const restoreAttachmentValidators = [...attachmentIdValidators];
