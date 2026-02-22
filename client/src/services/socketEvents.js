/**
 * @file Socket event registry (Phase 4).
 * @throws {never} Module initialization does not throw.
 */

import { SOCKET_EVENTS } from "../utils/constants";

/**
 * Socket event registry (mirrors backend `SOCKET_EVENTS`).
 *
 * @type {Record<string, string>}
 */
export const socketEvents = SOCKET_EVENTS;

export default socketEvents;
