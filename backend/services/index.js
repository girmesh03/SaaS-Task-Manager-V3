/**
 * @file Service export surface for phase 2 scaffolding.
 * @throws {never} Module initialization does not throw.
 */
export * as emailService from "./emailService.js";
export * as notificationService from "./notificationService.js";
export * as socketService from "./socketService.js";

/**
 * Current service implementation phase marker.
 * @type {"PHASE_2_SCAFFOLD"}
 */
export const SERVICES_PHASE = "PHASE_2_SCAFFOLD";
