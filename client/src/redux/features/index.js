/**
 * @file Redux feature export surface for phase 2.
 * @throws {never} Module initialization does not throw.
 */
export { default as authReducer } from "./authSlice";
export * from "./authSlice";
export { default as themeReducer } from "./themeSlice";
export * from "./themeSlice";
export { default as resourceViewReducer } from "./resourceViewSlice";
export * from "./resourceViewSlice";
export { default as notificationBadgeReducer } from "./notificationBadgeSlice";
export * from "./notificationBadgeSlice";

/**
 * Current Redux feature implementation phase marker.
 * @type {"PHASE_2_SCAFFOLD"}
 */
export const REDUX_FEATURES_PHASE = "PHASE_2_SCAFFOLD";
