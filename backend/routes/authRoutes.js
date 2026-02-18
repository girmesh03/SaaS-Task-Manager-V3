/**
 * @file Canonical auth route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  changePasswordValidators,
  forgotPasswordValidators,
  loginValidators,
  registerValidators,
  resendVerificationValidators,
  resetPasswordValidators,
  verifyEmailValidators,
} from "../middlewares/validators/index.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import validate from "../middlewares/validation.js";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerValidators), register);
router.post("/verify-email", authRateLimiter, validate(verifyEmailValidators), verifyEmail);
router.post(
  "/resend-verification",
  authRateLimiter,
  validate(resendVerificationValidators),
  resendVerification
);
router.post("/login", authRateLimiter, validate(loginValidators), login);
router.post("/refresh", authRateLimiter, refresh);
router.post("/logout", requireAuth, logout);
router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordValidators),
  forgotPassword
);
router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordValidators),
  resetPassword
);
router.post(
  "/change-password",
  requireAuth,
  validate(changePasswordValidators),
  changePassword
);

export default router;
