/**
 * @file Canonical user route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createUserValidators,
  deleteUserValidators,
  listUsersValidators,
  restoreUserValidators,
  updateUserPreferencesValidators,
  updateUserSecurityValidators,
  updateUserValidators,
  userActivityValidators,
  userIdValidators,
  userPerformanceValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createUser,
  deleteUser,
  getUser,
  getUserActivity,
  getUserPerformance,
  listUsers,
  restoreUser,
  updateUser,
  updateUserPreferences,
  updateUserSecurity,
} from "../controllers/userController.js";

const router = Router();

router.get("/", requireAuth, validate(listUsersValidators), authorize("User", "read"), listUsers);
router.post("/", requireAuth, validate(createUserValidators), authorize("User", "create"), createUser);
router.get(
  "/:userId",
  requireAuth,
  validate(userIdValidators),
  authorize("User", "read"),
  getUser
);
router.get(
  "/:userId/activity",
  requireAuth,
  validate(userActivityValidators),
  authorize("User", "read"),
  getUserActivity
);
router.get(
  "/:userId/performance",
  requireAuth,
  validate(userPerformanceValidators),
  authorize("User", "read"),
  getUserPerformance
);
router.put(
  "/:userId",
  requireAuth,
  validate(updateUserValidators),
  authorize("User", "update"),
  updateUser
);
router.put(
  "/:userId/preferences",
  requireAuth,
  validate(updateUserPreferencesValidators),
  authorize("User", "update"),
  updateUserPreferences
);
router.put(
  "/:userId/security",
  requireAuth,
  validate(updateUserSecurityValidators),
  authorize("User", "update"),
  updateUserSecurity
);
router.delete(
  "/:userId",
  requireAuth,
  validate(deleteUserValidators),
  authorize("User", "delete"),
  deleteUser
);
router.patch(
  "/:userId/restore",
  requireAuth,
  validate(restoreUserValidators),
  authorize("User", "delete"),
  restoreUser
);

export default router;
