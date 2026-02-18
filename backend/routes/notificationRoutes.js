/**
 * @file Canonical notification route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  deleteNotificationValidators,
  listNotificationValidators,
  markAllNotificationsReadValidators,
  markNotificationReadValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listNotificationValidators),
  authorize("Notification", "read"),
  listNotifications
);
router.patch(
  "/:notificationId/read",
  requireAuth,
  validate(markNotificationReadValidators),
  authorize("Notification", "update"),
  markNotificationRead
);
router.patch(
  "/mark-all-read",
  requireAuth,
  validate(markAllNotificationsReadValidators),
  authorize("Notification", "update"),
  markAllNotificationsRead
);
router.delete(
  "/:notificationId",
  requireAuth,
  validate(deleteNotificationValidators),
  authorize("Notification", "delete"),
  deleteNotification
);

export default router;
