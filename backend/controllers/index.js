/**
 * @file Controller export surface for phase 2 route scaffolding.
 * @throws {never} Module initialization does not throw.
 */
export * as authController from "./authController.js";
export * as userController from "./userController.js";
export * as departmentController from "./departmentController.js";
export * as taskController from "./taskController.js";
export * as taskActivityController from "./taskActivityController.js";
export * as taskCommentController from "./taskCommentController.js";
export * as materialController from "./materialController.js";
export * as vendorController from "./vendorController.js";
export * as attachmentController from "./attachmentController.js";
export * as notificationController from "./notificationController.js";
export * as dashboardController from "./dashboardController.js";
export * as organizationController from "./organizationController.js";

/**
 * Current controller implementation phase marker.
 * @type {"PHASE_2_SCAFFOLD"}
 */
export const CONTROLLERS_PHASE = "PHASE_2_SCAFFOLD";
