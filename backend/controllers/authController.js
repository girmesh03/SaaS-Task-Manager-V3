/**
 * @file Auth controllers (Phase 3 production behavior).
 */
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Department from "../models/Department.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import {
  COOKIE_DEFAULTS,
  DEPARTMENT_STATUS,
  HTTP_STATUS,
  TIME_UNITS,
  USER_ROLES,
  USER_STATUS,
} from "../utils/constants.js";
import { resolveEnvironment } from "../utils/env.js";
import {
  ConflictError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.js";
import { normalizeId, withMongoTransaction } from "../utils/helpers.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/emailService.js";

const DEFAULT_ACCESS_EXPIRY = "15m";
const DEFAULT_REFRESH_EXPIRY = "7d";
const VERIFICATION_TOKEN_TTL_MS = 24 * TIME_UNITS.HOUR_SECONDS * TIME_UNITS.SECOND_MS;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * TIME_UNITS.MINUTE_SECONDS * TIME_UNITS.SECOND_MS;

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const toMilliseconds = (value, fallbackMs) => {
  const raw = String(value || "").trim().toLowerCase();
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: TIME_UNITS.SECOND_MS,
    m: TIME_UNITS.MINUTE_SECONDS * TIME_UNITS.SECOND_MS,
    h: TIME_UNITS.HOUR_SECONDS * TIME_UNITS.SECOND_MS,
    d: TIME_UNITS.DAY_MS,
  };

  return amount * multipliers[unit];
};

const generateOpaqueToken = () => crypto.randomBytes(32).toString("hex");

const getCookieNames = (env) => ({
  access: env.COOKIE_NAME_ACCESS || COOKIE_DEFAULTS.ACCESS_TOKEN_NAME,
  refresh: env.COOKIE_NAME_REFRESH || COOKIE_DEFAULTS.REFRESH_TOKEN_NAME,
});

const getCookieOptions = (env) => {
  const secure = String(env.COOKIE_SECURE || "false").toLowerCase() === "true";
  const sameSiteRaw = String(
    env.COOKIE_SAME_SITE || (secure ? "none" : "lax")
  ).toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(sameSiteRaw)
    ? sameSiteRaw
    : "lax";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

const clearAuthCookies = (res, env) => {
  const cookieNames = getCookieNames(env);
  const cookieOptions = getCookieOptions(env);
  res.clearCookie(cookieNames.access, cookieOptions);
  res.clearCookie(cookieNames.refresh, cookieOptions);
};

const buildUserSummary = (user) => {
  const organization = user.organization || {};
  const department = user.department || {};

  return {
    id: normalizeId(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.email,
    role: user.role,
    status: user.status,
    isPlatformOrgUser: Boolean(user.isPlatformOrgUser),
    isHod: Boolean(user.isHod),
    organization: {
      id: normalizeId(organization._id || organization.id || user.organization),
      name: organization.name || "",
    },
    department: {
      id: normalizeId(department._id || department.id || user.department),
      name: department.name || "",
    },
    preferences: user.preferences || null,
    security: user.security || null,
  };
};

const buildJwtPayload = (user) => {
  const summary = buildUserSummary(user);

  return {
    sub: summary.id,
    email: summary.email,
    firstName: summary.firstName,
    lastName: summary.lastName,
    role: summary.role,
    organization: summary.organization.id,
    organizationName: summary.organization.name,
    department: summary.department.id,
    departmentName: summary.department.name,
    isPlatformOrgUser: summary.isPlatformOrgUser,
    isHod: summary.isHod,
  };
};

const issueAuthSession = async ({ user, res, env }) => {
  if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
    throw new UnauthorizedError("Authentication secrets are not configured");
  }

  const accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN || DEFAULT_ACCESS_EXPIRY;
  const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_EXPIRY;
  const payload = buildJwtPayload(user);

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: accessExpiresIn,
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn,
  });

  const cookieNames = getCookieNames(env);
  const cookieOptions = getCookieOptions(env);
  res.cookie(cookieNames.access, accessToken, cookieOptions);
  res.cookie(cookieNames.refresh, refreshToken, cookieOptions);

  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(
    Date.now() + toMilliseconds(refreshExpiresIn, 7 * TIME_UNITS.DAY_MS)
  );
};

const assertActiveAndVerified = (user) => {
  if (!user || user.isDeleted) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new UnauthorizedError("Account is inactive");
  }

  if (!user.isVerified) {
    throw new UnauthorizedError("Account is not verified");
  }

  if (user.organization && user.organization.isVerified === false) {
    throw new UnauthorizedError("Organization is not verified");
  }
};

const buildVerificationUrl = (token, env) => {
  const clientOrigin = String(env.CLIENT_ORIGIN || "").trim() || "http://localhost:5173";
  return `${clientOrigin}/verify-email?token=${encodeURIComponent(token)}`;
};

const buildPasswordResetUrl = (token, env) => {
  const clientOrigin = String(env.CLIENT_ORIGIN || "").trim() || "http://localhost:5173";
  return `${clientOrigin}/reset-password?token=${encodeURIComponent(token)}`;
};

const findAuthUserByEmail = (email, session = null) => {
  const query = User.findOne({ email: normalizeEmail(email) })
    .withDeleted()
    .select(
      "+password +refreshToken +refreshTokenExpiry +verificationToken +verificationTokenExpiry +emailVerificationToken +emailVerificationExpiry +passwordResetToken +passwordResetExpiry"
    )
    .populate("organization", "name isVerified")
    .populate("department", "name");

  if (session) {
    query.session(session);
  }

  return query;
};

const mapDuplicateKeyError = (error) => {
  if (!error || error.code !== 11000) {
    return null;
  }

  const keys = Object.keys(error.keyPattern || {});
  if (keys.includes("email")) {
    return new ConflictError("Email already exists");
  }

  if (keys.includes("employeeId")) {
    return new ConflictError("Employee ID already exists");
  }

  if (keys.includes("name")) {
    return new ConflictError("Name already exists");
  }

  return new ConflictError("Resource already exists");
};

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const payload = req.validated.body;
  const organizationInput = payload.organization || {};
  const departmentInput = payload.department || {};
  const userInput = payload.user || {};
  try {
    const verificationToken = generateOpaqueToken();
    const verificationExpiry = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    const { createdDepartment, createdOrganization, createdUser } =
      await withMongoTransaction(async (session) => {
        const existingOrganization = await Organization.findOne({
          email: normalizeEmail(organizationInput.email),
        })
          .withDeleted()
          .session(session);

        if (existingOrganization) {
          throw new ConflictError("Organization email already exists");
        }

        const createdOrganization = new Organization({
          name: organizationInput.name,
          email: normalizeEmail(organizationInput.email),
          phone: organizationInput.phone,
          address: organizationInput.address,
          industry: organizationInput.industry,
          size: organizationInput.size,
          description: organizationInput.description || "",
          isPlatformOrg: false,
          isVerified: false,
          createdBy: null,
        });
        await createdOrganization.save({ session });

        const createdDepartment = new Department({
          name: departmentInput.name,
          description: departmentInput.description,
          status: DEPARTMENT_STATUS.ACTIVE,
          manager: null,
          organization: createdOrganization._id,
          createdBy: null,
        });
        await createdDepartment.save({ session });

        const createdUser = new User({
          firstName: userInput.firstName,
          lastName: userInput.lastName,
          position: userInput.position,
          email: normalizeEmail(userInput.email),
          password: userInput.password,
          role: USER_ROLES.SUPER_ADMIN,
          status: USER_STATUS.ACTIVE,
          department: createdDepartment._id,
          organization: createdOrganization._id,
          isHod: true,
          isPlatformOrgUser: false,
          isVerified: false,
          verificationToken,
          verificationTokenExpiry: verificationExpiry,
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        });
        await createdUser.save({ session });

        createdDepartment.manager = createdUser._id;
        createdDepartment.createdBy = createdUser._id;
        await createdDepartment.save({ session });

        createdOrganization.createdBy = createdUser._id;
        await createdOrganization.save({ session });

        return {
          createdOrganization,
          createdDepartment,
          createdUser,
        };
      });

    const verificationUrl = buildVerificationUrl(verificationToken, env);
    await sendVerificationEmail({
      to: normalizeEmail(userInput.email),
      verificationUrl,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Verification email sent",
      data: {
        organization: {
          id: normalizeId(createdOrganization?._id),
          name: createdOrganization?.name || "",
        },
        department: {
          id: normalizeId(createdDepartment?._id),
          name: createdDepartment?.name || "",
        },
        user: {
          id: normalizeId(createdUser?._id),
          email: createdUser?.email || "",
        },
      },
    });
  } catch (error) {
    const mapped = mapDuplicateKeyError(error);
    next(mapped || error);
  }
});

/**
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const payload = req.validated.body;
  const token = String(payload.token || "").trim();

  try {
    const { sendWelcome, userEmail, userFullName, userId } =
      await withMongoTransaction(async (session) => {
        const user = await User.findOne({
          $or: [{ verificationToken: token }, { emailVerificationToken: token }],
        })
          .withDeleted()
          .select(
            "+verificationToken +verificationTokenExpiry +emailVerificationToken +emailVerificationExpiry"
          )
          .populate("organization", "name isVerified verifiedAt")
          .session(session);

        if (!user || user.isDeleted) {
          throw new NotFoundError("Verification token was not found");
        }

        const tokenExpiry =
          user.verificationTokenExpiry || user.emailVerificationExpiry;
        if (!tokenExpiry || tokenExpiry.getTime() < Date.now()) {
          throw new ValidationError("Verification token is invalid or expired");
        }

        const shouldSendWelcome = !user.welcomeEmailSentAt;

        user.isVerified = true;
        user.emailVerifiedAt = new Date();
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        user.emailVerificationToken = null;
        user.emailVerificationExpiry = null;

        await user.save({ session });

        const organizationId = normalizeId(user.organization?._id || user.organization);
        if (organizationId) {
          await Organization.findByIdAndUpdate(
            organizationId,
            {
              isVerified: true,
              verifiedAt: new Date(),
            },
            { session },
          );
        }

        return {
          sendWelcome: shouldSendWelcome,
          userEmail: user.email,
          userFullName:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          userId: normalizeId(user._id),
        };
      });

    if (sendWelcome) {
      await sendWelcomeEmail({
        to: userEmail,
        fullName: userFullName,
      });

      await withMongoTransaction(async (session) => {
        await User.findByIdAndUpdate(
          userId,
          { welcomeEmailSentAt: new Date() },
          { session },
        );
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/resend-verification
 */
export const resendVerification = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const payload = req.validated.body;
  const email = normalizeEmail(payload.email);

  try {
    const { verificationToken, recipientEmail } =
      await withMongoTransaction(async (session) => {
        const user = await User.findOne({ email })
          .withDeleted()
          .select(
            "+verificationToken +verificationTokenExpiry +emailVerificationToken +emailVerificationExpiry"
          )
          .session(session);

        if (!user || user.isDeleted) {
          throw new NotFoundError("User not found");
        }

        if (user.isVerified) {
          return {
            verificationToken: null,
            recipientEmail: user.email,
            alreadyVerified: true,
          };
        }

        const verificationToken = generateOpaqueToken();
        const verificationExpiry = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = verificationExpiry;
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpiry = verificationExpiry;
        await user.save({ session });

        return {
          verificationToken,
          recipientEmail: user.email,
          alreadyVerified: false,
        };
      });

    if (!verificationToken) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Account is already verified",
      });
      return;
    }

    await sendVerificationEmail({
      to: recipientEmail,
      verificationUrl: buildVerificationUrl(verificationToken, env),
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const payload = req.validated.body;
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  try {
    const user = await withMongoTransaction(async (session) => {
      const user = await findAuthUserByEmail(email, session);
      if (!user || user.isDeleted) {
        throw new UnauthenticatedError("Invalid credentials");
      }

      const passwordMatches = await bcrypt.compare(password, user.password || "");
      if (!passwordMatches) {
        throw new UnauthenticatedError("Invalid credentials");
      }

      assertActiveAndVerified(user);

      await issueAuthSession({ user, res, env });
      user.lastLogin = new Date();
      await user.save({ session });
      return user;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      data: {
        user: buildUserSummary(user),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const cookieNames = getCookieNames(env);
  const refreshToken = req.cookies?.[cookieNames.refresh];

  try {
    if (!refreshToken) {
      throw new UnauthenticatedError("Refresh token is missing");
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (_error) {
      throw new UnauthenticatedError("Refresh token is invalid or expired");
    }

    const userId = normalizeId(payload?.sub || payload?.id || payload?.userId);
    const user = await withMongoTransaction(async (session) => {
      const user = await User.findById(userId)
        .withDeleted()
        .select("+refreshToken +refreshTokenExpiry")
        .populate("organization", "name isVerified")
        .populate("department", "name")
        .session(session);

      if (!user || user.isDeleted) {
        throw new UnauthenticatedError("Session not found");
      }

      assertActiveAndVerified(user);

      if (!user.refreshToken || user.refreshToken !== refreshToken) {
        throw new UnauthenticatedError("Refresh token mismatch");
      }

      if (
        user.refreshTokenExpiry &&
        new Date(user.refreshTokenExpiry).getTime() < Date.now()
      ) {
        throw new UnauthenticatedError("Refresh session expired");
      }

      await issueAuthSession({ user, res, env });
      await user.save({ session });
      return user;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Token refreshed",
      data: {
        user: buildUserSummary(user),
      },
    });
  } catch (error) {
    clearAuthCookies(res, env);
    next(error);
  }
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);

  try {
    const userId = normalizeId(req.user?.id);
    if (userId) {
      await withMongoTransaction(async (session) => {
        await User.findByIdAndUpdate(
          userId,
          {
            refreshToken: null,
            refreshTokenExpiry: null,
          },
          { session },
        );
      });
    }

    clearAuthCookies(res, env);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const payload = req.validated.body;
  const email = normalizeEmail(payload.email);

  try {
    const emailPayload = await withMongoTransaction(async (session) => {
      const user = await User.findOne({ email })
        .withDeleted()
        .select("+passwordResetToken +passwordResetExpiry")
        .session(session);

      if (!user || user.isDeleted) {
        return null;
      }

      const resetToken = generateOpaqueToken();
      user.passwordResetToken = resetToken;
      user.passwordResetExpiry = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
      await user.save({ session });

      return {
        to: user.email,
        token: resetToken,
      };
    });

    if (emailPayload) {
      await sendPasswordResetEmail({
        to: emailPayload.to,
        resetUrl: buildPasswordResetUrl(emailPayload.token, env),
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const payload = req.validated.body;
  const token = String(payload.token || "").trim();
  const password = String(payload.password || "");

  try {
    await withMongoTransaction(async (session) => {
      const user = await User.findOne({ passwordResetToken: token })
        .withDeleted()
        .select("+password +passwordResetToken +passwordResetExpiry")
        .session(session);

      if (!user || user.isDeleted) {
        throw new UnauthenticatedError("Reset token is invalid or expired");
      }

      if (
        !user.passwordResetExpiry ||
        new Date(user.passwordResetExpiry).getTime() < Date.now()
      ) {
        throw new UnauthenticatedError("Reset token is invalid or expired");
      }

      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpiry = null;
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      await user.save({ session });
    });

    clearAuthCookies(res, env);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  const env = resolveEnvironment(process.env);
  const payload = req.validated.body;
  const currentPassword = String(payload.currentPassword || "");
  const newPassword = String(payload.newPassword || "");

  try {
    await withMongoTransaction(async (session) => {
      const user = await User.findById(req.user?.id)
        .withDeleted()
        .select("+password +refreshToken +refreshTokenExpiry")
        .session(session);

      if (!user || user.isDeleted) {
        throw new NotFoundError("User not found");
      }

      if (user.status !== USER_STATUS.ACTIVE) {
        throw new UnauthorizedError("Account is inactive");
      }

      const passwordMatches = await bcrypt.compare(currentPassword, user.password || "");
      if (!passwordMatches) {
        throw new UnauthenticatedError("Current password is incorrect");
      }

      if (currentPassword === newPassword) {
        throw new ValidationError("New password must be different from current password");
      }

      user.password = newPassword;
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      await user.save({ session });
    });

    clearAuthCookies(res, env);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
