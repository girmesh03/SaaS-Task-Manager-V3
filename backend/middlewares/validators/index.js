/**
 * @file Barrel exports for backend validator modules.
 * @throws {never} Module initialization does not throw.
 */
export * from "./authValidators.js";
export * from "./organizationValidators.js";
export * from "./departmentValidators.js";
export * from "./userValidators.js";
export * from "./taskValidators.js";
export * from "./taskActivityValidators.js";
export * from "./taskCommentValidators.js";
export * from "./materialValidators.js";
export * from "./vendorValidators.js";
export * from "./attachmentValidators.js";
export * from "./notificationValidators.js";
export * from "./dashboardValidators.js";
export * from "./shared.js";

/**
 * Current validator implementation phase marker.
 * @type {"PHASE_2_SCAFFOLD"}
 */
export const VALIDATORS_PHASE = "PHASE_2_SCAFFOLD";
