/**
 * @file Notification endpoint validators.
 */
import { param, query } from "express-validator";
import Notification from "../../models/Notification.js";
import { NOTIFICATION_ENTITY_MODELS } from "../../utils/constants.js";
import {
  isoDateQuery,
  objectIdParam,
  paginationValidators,
} from "./shared.js";

const ensureNotificationExists = async (value) => {
  const notification = await Notification.findById(value).withDeleted();
  if (!notification) {
    throw new Error("Notification not found");
  }

  return true;
};

/**
 * Validators for `GET /api/notifications`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const listNotificationValidators = [
  ...paginationValidators(),
  query("isRead")
    .optional()
    .isBoolean()
    .withMessage("isRead must be a boolean"),
  query("entityModel")
    .optional({ values: "falsy" })
    .isIn(NOTIFICATION_ENTITY_MODELS)
    .withMessage("entityModel is invalid"),
  isoDateQuery("from"),
  isoDateQuery("to"),
];

/**
 * Validators for `:notificationId` params.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const notificationIdValidators = [
  objectIdParam("notificationId"),
  param("notificationId").custom(ensureNotificationExists),
];

/**
 * Validators for `PATCH /api/notifications/:notificationId/read`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const markNotificationReadValidators = [...notificationIdValidators];

/**
 * Validators for `PATCH /api/notifications/mark-all-read`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const markAllNotificationsReadValidators = [];

/**
 * Validators for `DELETE /api/notifications/:notificationId`.
 *
 * @type {import("express-validator").ValidationChain[]}
 */
export const deleteNotificationValidators = [...notificationIdValidators];
