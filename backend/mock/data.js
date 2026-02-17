/**
 * @file Phase 1 mock-data placeholder.
 * @throws {never} Module initialization does not throw.
 *
 * Seeding fixtures are intentionally deferred to Phase 2 because model
 * implementations are not active in Phase 1.
 */

/**
 * Environment variable keys that Phase 2 seeding must consume for platform
 * bootstrap entities.
 *
 * - `organization`: Platform organization source of truth
 * - `department`: First platform department source of truth
 * - `user`: First platform department user source of truth
 *
 * @type {Readonly<{
 *   organization: readonly string[];
 *   department: readonly string[];
 *   user: readonly string[];
 * }>}
 */
export const PLATFORM_SEED_ENV_KEYS = Object.freeze({
  organization: Object.freeze([
    "PLATFORM_ORGANIZATION_NAME",
    "PLATFORM_ORGANIZATION_DESCRIPTION",
    "PLATFORM_ORGANIZATION_EMAIL",
    "PLATFORM_ORGANIZATION_PHONE",
    "PLATFORM_ORGANIZATION_ADDRESS",
    "PLATFORM_ORGANIZATION_SIZE",
    "PLATFORM_ORGANIZATION_INDUSTRY",
  ]),
  department: Object.freeze([
    "PLATFORM_DEPARTMENT_NAME",
    "PLATFORM_DEPARTMENT_DESCRIPTION",
  ]),
  user: Object.freeze([
    "PLATFORM_ADMIN_FIRST_NAME",
    "PLATFORM_ADMIN_LAST_NAME",
    "PLATFORM_ADMIN_POSITION",
    "PLATFORM_ADMIN_ROLE",
    "PLATFORM_ADMIN_EMAIL",
    "PLATFORM_ADMIN_PASSWORD",
  ]),
});

/**
 * Phase status marker for mock data implementation.
 * @type {Readonly<{ implemented: false; plannedPhase: "PHASE_2" }>}
 */
export const MOCK_DATA_PHASE = Object.freeze({
  implemented: false,
  plannedPhase: "PHASE_2",
});
