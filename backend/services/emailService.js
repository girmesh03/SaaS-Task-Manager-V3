/**
 * @file Email service scaffold for phase 2.
 */
import nodemailer from "nodemailer";
import getEmailConfig from "../config/email.js";
import logger from "../utils/logger.js";

const buildTransporter = () => {
  const config = getEmailConfig();
  if (!config.enabled) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
};

let transporter = null;

/**
 * Initializes email transporter lazily.
 *
 * @returns {import("nodemailer").Transporter | null} Transporter instance when enabled.
 * @throws {Error} Throws when transport initialization fails.
 */
export const initializeEmailService = () => {
  if (transporter) {
    return transporter;
  }

  transporter = buildTransporter();
  return transporter;
};

/**
 * Sends an email using configured transport or returns a no-op result when disabled.
 *
 * @param {{ to: string; subject: string; text?: string; html?: string }} payload - Email payload.
 * @returns {Promise<{ sent: boolean; skipped: boolean; messageId: string | null }>} Send result.
 * @throws {Error} Throws when email sending fails and transport is enabled.
 */
export const sendEmail = async ({ to, subject, text = "", html = "" }) => {
  const config = getEmailConfig();
  const activeTransport = initializeEmailService();

  if (!config.enabled || !activeTransport) {
    logger.info("Email send skipped because email transport is disabled", {
      to,
      subject,
    });

    return {
      sent: false,
      skipped: true,
      messageId: null,
    };
  }

  const info = await activeTransport.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });

  return {
    sent: true,
    skipped: false,
    messageId: info.messageId || null,
  };
};

const buildSimpleTemplate = (title, lines = []) => {
  const text = [title, "", ...lines].join("\n");
  const htmlBody = lines.map((line) => `<p>${line}</p>`).join("");
  const html = `<h2>${title}</h2>${htmlBody}`;

  return { text, html };
};

/**
 * Sends verification email.
 *
 * @param {{ to: string; verificationUrl: string }} payload - Verification email payload.
 * @returns {Promise<{ sent: boolean; skipped: boolean; messageId: string | null }>} Send result.
 * @throws {Error} Throws when email sending fails and transport is enabled.
 */
export const sendVerificationEmail = async ({ to, verificationUrl }) => {
  const template = buildSimpleTemplate("Verify your account", [
    "Please verify your account by visiting the link below:",
    verificationUrl,
  ]);

  return sendEmail({
    to,
    subject: "Verify your TaskManager account",
    ...template,
  });
};

/**
 * Sends welcome email.
 *
 * @param {{ to: string; fullName: string }} payload - Welcome email payload.
 * @returns {Promise<{ sent: boolean; skipped: boolean; messageId: string | null }>} Send result.
 * @throws {Error} Throws when email sending fails and transport is enabled.
 */
export const sendWelcomeEmail = async ({ to, fullName }) => {
  const template = buildSimpleTemplate("Welcome to TaskManager", [
    `Hello ${fullName},`,
    "Your account is ready.",
  ]);

  return sendEmail({
    to,
    subject: "Welcome to TaskManager",
    ...template,
  });
};

/**
 * Sends password reset email.
 *
 * @param {{ to: string; resetUrl: string }} payload - Password reset email payload.
 * @returns {Promise<{ sent: boolean; skipped: boolean; messageId: string | null }>} Send result.
 * @throws {Error} Throws when email sending fails and transport is enabled.
 */
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const template = buildSimpleTemplate("Password reset request", [
    "Use the link below to reset your password:",
    resetUrl,
  ]);

  return sendEmail({
    to,
    subject: "Reset your TaskManager password",
    ...template,
  });
};

/**
 * Sends vendor contact email.
 *
 * @param {{ to: string; subject: string; message: string; cc?: string }} payload - Vendor contact payload.
 * @returns {Promise<{ sent: boolean; skipped: boolean; messageId: string | null }>} Send result.
 * @throws {Error} Throws when email sending fails and transport is enabled.
 */
export const sendVendorContactEmail = async ({ to, subject, message, cc = "" }) => {
  return sendEmail({
    to,
    subject,
    text: message,
    html: `<p>${message}</p>${cc ? `<p>CC: ${cc}</p>` : ""}`,
  });
};

export default {
  initializeEmailService,
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVendorContactEmail,
};
