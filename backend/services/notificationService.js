/**
 * @file Notification service scaffold for phase 2.
 */
import Notification from "../models/Notification.js";
import { parsePagination } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import { sendEmail } from "./emailService.js";

/**
 * Creates a notification record.
 *
 * @param {{
 *   title: string;
 *   message: string;
 *   user: string;
 *   organization: string;
 *   department: string;
 *   entity?: string | null;
 *   entityModel?: string | null;
 * }} payload - Notification payload.
 * @returns {Promise<import("mongoose").Document | null>} Created notification document.
 * @throws {Error} Throws when persistence fails.
 */
export const createNotification = async (payload) => {
  const document = await Notification.create(payload);
  return document;
};

/**
 * Returns paginated notifications for a user.
 *
 * @param {{ userId: string; page?: number; limit?: number; includeDeleted?: boolean }} options - List options.
 * @returns {Promise<{
 *   data: import("mongoose").Document[];
 *   total: number;
 *   pagination: import("mongoose-paginate-v2").PaginateResult<import("mongoose").Document>;
 * }>} Notification list result.
 * @throws {Error} Throws when persistence fails.
 */
export const listNotifications = async ({
  userId,
  page = 1,
  limit = 20,
  includeDeleted = false,
}) => {
  const query = { user: userId };
  const pagination = parsePagination({ page, limit, sortBy: "createdAt", sortOrder: "desc" });
  const paginationResult = await Notification.paginate(query, {
    ...pagination.paginateOptions,
    customFind: includeDeleted ? "findWithDeleted" : "find",
  });

  return {
    data: paginationResult.docs || [],
    total: paginationResult.totalDocs || 0,
    pagination: paginationResult,
  };
};

/**
 * Marks one notification as read.
 *
 * @param {{ notificationId: string; userId: string }} options - Mark-read options.
 * @returns {Promise<import("mongoose").Document | null>} Updated notification.
 * @throws {Error} Throws when persistence fails.
 */
export const markNotificationRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );

  return notification;
};

/**
 * Marks all user notifications as read.
 *
 * @param {{ userId: string }} options - Mark-all-read options.
 * @returns {Promise<{ modifiedCount: number }>} Update summary.
 * @throws {Error} Throws when persistence fails.
 */
export const markAllNotificationsRead = async ({ userId }) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

/**
 * Soft-deletes a notification.
 *
 * @param {{ notificationId: string; deletedBy?: string | null }} options - Delete options.
 * @returns {Promise<import("mongoose").Document | null>} Deleted notification.
 * @throws {Error} Throws when persistence fails.
 */
export const deleteNotification = async ({ notificationId, deletedBy = null }) => {
  const notification = await Notification.findById(notificationId).withDeleted();
  if (!notification) {
    return null;
  }

  await notification.softDelete(deletedBy);
  return notification;
};

/**
 * Sends optional notification email based on user preference context.
 *
 * @param {{
 *   enabled: boolean;
 *   to: string;
 *   subject: string;
 *   message: string;
 * }} options - Email notification options.
 * @returns {Promise<void>} Resolves when email path completes.
 * @throws {Error} Throws only when enabled email send fails.
 */
export const sendOptionalNotificationEmail = async ({ enabled, to, subject, message }) => {
  if (!enabled) {
    return;
  }

  await sendEmail({
    to,
    subject,
    text: message,
    html: `<p>${message}</p>`,
  });
};

/**
 * Attempts notification creation and logs failures without throwing.
 *
 * @param {Parameters<typeof createNotification>[0]} payload - Notification payload.
 * @returns {Promise<import("mongoose").Document | null>} Created notification or null.
 * @throws {never} Failures are logged and converted to `null`.
 */
export const createNotificationSafe = async (payload) => {
  try {
    return await createNotification(payload);
  } catch (error) {
    logger.error("Notification creation failed", {
      message: error.message,
      payload,
    });
    return null;
  }
};

export default {
  createNotification,
  createNotificationSafe,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  sendOptionalNotificationEmail,
};
