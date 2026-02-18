/**
 * @file Notification controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listNotifications = createPlaceholderController("Notification", "listNotifications");
export const markNotificationRead = createPlaceholderController("Notification", "markNotificationRead");
export const markAllNotificationsRead = createPlaceholderController("Notification", "markAllNotificationsRead");
export const deleteNotification = createPlaceholderController("Notification", "deleteNotification");

export default {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
