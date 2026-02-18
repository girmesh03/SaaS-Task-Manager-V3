/**
 * @file Phase 2 deterministic mock data and seed input helpers.
 */
import {
  DEPARTMENT_STATUS,
  MATERIAL_STATUS,
  MOCK_DEFAULTS,
  NODE_ENVS,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
  USER_ROLES,
  USER_STATUS,
  VENDOR_STATUS,
} from "../utils/constants.js";

const normalizeEmailLocalPart = (value = "") => {
  const localPart = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return localPart || "user";
};

const toGmailFromName = (nameOrFirstName = "") => {
  return `${normalizeEmailLocalPart(nameOrFirstName)}@${MOCK_DEFAULTS.GMAIL_DOMAIN}`;
};

const resolveMockPassword = (env = process.env) => {
  const environment = String(env.NODE_ENV || NODE_ENVS.DEVELOPMENT).toLowerCase();
  if (environment === NODE_ENVS.DEVELOPMENT) {
    return MOCK_DEFAULTS.PASSWORD;
  }

  return env.PLATFORM_ADMIN_PASSWORD || MOCK_DEFAULTS.PASSWORD;
};

/**
 * Environment variable keys used to derive platform seed source values.
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
 * Resolves platform seed payload from environment variables.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Source environment object.
 * @returns {{
 *   organization: {
 *     name: string;
 *     description: string;
 *     email: string;
 *     phone: string;
 *     address: string;
 *     size: string;
 *     industry: string;
 *   };
 *   department: {
 *     name: string;
 *     description: string;
 *   };
 *   user: {
 *     firstName: string;
 *     lastName: string;
 *     position: string;
 *     role: string;
 *     email: string;
 *     password: string;
 *   };
 * }} Platform seed payload.
 * @throws {never} This helper does not throw.
 */
export const getPlatformSeedFromEnv = (env = process.env) => {
  const organizationName = env.PLATFORM_ORGANIZATION_NAME || "TaskManager Platform";
  const adminFirstName = env.PLATFORM_ADMIN_FIRST_NAME || "Platform";
  const organizationEmail = toGmailFromName(organizationName);
  const adminEmail = toGmailFromName(adminFirstName);

  return {
    organization: {
      name: organizationName,
      description:
        env.PLATFORM_ORGANIZATION_DESCRIPTION ||
        "System administration organization for the multi-tenant platform.",
      email: organizationEmail,
      phone: env.PLATFORM_ORGANIZATION_PHONE || "+251900000000",
      address: env.PLATFORM_ORGANIZATION_ADDRESS || "Addis Ababa",
      size: env.PLATFORM_ORGANIZATION_SIZE || "Small",
      industry: env.PLATFORM_ORGANIZATION_INDUSTRY || "Technology",
    },
    department: {
      name: env.PLATFORM_DEPARTMENT_NAME || "Platform Administration",
      description:
        env.PLATFORM_DEPARTMENT_DESCRIPTION ||
        "Owns platform runtime, governance, and tenant administration.",
    },
    user: {
      firstName: adminFirstName,
      lastName: env.PLATFORM_ADMIN_LAST_NAME || "Admin",
      position: env.PLATFORM_ADMIN_POSITION || "System Owner",
      role: env.PLATFORM_ADMIN_ROLE || USER_ROLES.SUPER_ADMIN,
      email: adminEmail,
      password: resolveMockPassword(env),
    },
  };
};

/**
 * Deterministic fixture blueprint reserved for vertical-slice phases.
 *
 * @type {Readonly<Record<string, unknown>>}
 */
export const PHASE_TWO_FIXTURE_BLUEPRINT = Object.freeze({
  organizations: [
    {
      key: "customer_org_alpha",
      name: "Alpha Build Co",
      email: toGmailFromName("Alpha Build Co"),
      industry: "Construction",
      size: "Medium",
      isPlatformOrg: false,
      isVerified: true,
    },
    {
      key: "customer_org_beta",
      name: "Beta Care Ltd",
      email: toGmailFromName("Beta Care Ltd"),
      industry: "Healthcare",
      size: "Small",
      isPlatformOrg: false,
      isVerified: true,
    },
  ],
  departments: [
    {
      key: "alpha_engineering",
      organizationKey: "customer_org_alpha",
      name: "Engineering",
      status: DEPARTMENT_STATUS.ACTIVE,
      description: "Engineering execution department",
    },
    {
      key: "alpha_operations_inactive",
      organizationKey: "customer_org_alpha",
      name: "Operations",
      status: DEPARTMENT_STATUS.INACTIVE,
      description: "Inactive department used for create-block validation",
    },
  ],
  users: [
    {
      key: "platform_superadmin",
      firstName: "Platform",
      email: toGmailFromName("Platform"),
      password: MOCK_DEFAULTS.PASSWORD,
      role: USER_ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      isPlatformOrgUser: true,
      isHod: true,
    },
    {
      key: "alpha_superadmin",
      firstName: "Alpha",
      email: toGmailFromName("Alpha"),
      password: MOCK_DEFAULTS.PASSWORD,
      role: USER_ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      isPlatformOrgUser: false,
      isHod: true,
    },
    {
      key: "alpha_admin",
      firstName: "Admin",
      email: toGmailFromName("Admin"),
      password: MOCK_DEFAULTS.PASSWORD,
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      isPlatformOrgUser: false,
      isHod: false,
    },
    {
      key: "alpha_manager",
      firstName: "Manager",
      email: toGmailFromName("Manager"),
      password: MOCK_DEFAULTS.PASSWORD,
      role: USER_ROLES.MANAGER,
      status: USER_STATUS.ACTIVE,
      isPlatformOrgUser: false,
      isHod: false,
    },
    {
      key: "alpha_user",
      firstName: "User",
      email: toGmailFromName("User"),
      password: MOCK_DEFAULTS.PASSWORD,
      role: USER_ROLES.USER,
      status: USER_STATUS.ACTIVE,
      isPlatformOrgUser: false,
      isHod: false,
    },
  ],
  tasks: [
    {
      key: "project_todo",
      type: TASK_TYPE.PROJECT,
      status: TASK_STATUS.TODO,
      priority: TASK_PRIORITY.HIGH,
      tags: ["project", "vendor"],
      isDeleted: false,
    },
    {
      key: "assigned_in_progress",
      type: TASK_TYPE.ASSIGNED,
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.URGENT,
      tags: ["assigned", "critical"],
      isDeleted: false,
    },
    {
      key: "routine_completed_deleted",
      type: TASK_TYPE.ROUTINE,
      status: TASK_STATUS.COMPLETED,
      priority: TASK_PRIORITY.MEDIUM,
      tags: ["routine", "daily"],
      isDeleted: true,
    },
  ],
  materials: [
    {
      key: "material_low_stock",
      status: MATERIAL_STATUS.ACTIVE,
      sku: "MT-LOW-0001",
      stockOnHand: 2,
      lowStockThreshold: 5,
      isDeleted: false,
    },
    {
      key: "material_associated_deleted",
      status: MATERIAL_STATUS.ACTIVE,
      sku: "MT-ASOC-0002",
      stockOnHand: 20,
      lowStockThreshold: 3,
      isDeleted: true,
    },
  ],
  vendors: [
    {
      key: "vendor_active_verified",
      name: "Vendor Active",
      email: toGmailFromName("Vendor Active"),
      status: VENDOR_STATUS.ACTIVE,
      isVerifiedPartner: true,
      rating: 4.5,
      isDeleted: false,
    },
    {
      key: "vendor_inactive_associated",
      name: "Vendor Inactive",
      email: toGmailFromName("Vendor Inactive"),
      status: VENDOR_STATUS.INACTIVE,
      isVerifiedPartner: false,
      rating: 3,
      isDeleted: true,
    },
  ],
  comments: [
    {
      key: "comment_depth_4",
      depth: 4,
      hasMentions: true,
    },
    {
      key: "comment_depth_5_boundary",
      depth: 5,
      hasMentions: false,
    },
  ],
  scenarios: {
    lowStock: {
      description: "Material stock would go below zero on routine or activity usage",
      materialKey: "material_low_stock",
      requestedQuantity: 5,
      expectedErrorCode: "CONFLICT_ERROR",
    },
    vendorDeleteConflict: {
      description: "Deleting a vendor that is associated with project tasks",
      vendorKey: "vendor_inactive_associated",
      expectedErrorCode: "CONFLICT_ERROR",
    },
    commentDepthLimit: {
      description: "Attempting to create a comment reply beyond depth=5",
      parentCommentKey: "comment_depth_5_boundary",
      expectedErrorCode: "VALIDATION_ERROR",
    },
    inactiveDepartmentCreateBlock: {
      description: "Attempting to create users/tasks/materials under an inactive department",
      departmentKey: "alpha_operations_inactive",
      expectedErrorCode: "CONFLICT_ERROR",
    },
  },
});

/**
 * Returns fixture blueprint with explicit phase metadata.
 *
 * @returns {{ phase: "PHASE_2"; fixtures: typeof PHASE_TWO_FIXTURE_BLUEPRINT }} Fixture descriptor.
 * @throws {never} This helper does not throw.
 */
export const getPhaseTwoFixtureDescriptor = () => {
  return {
    phase: "PHASE_2",
    fixtures: PHASE_TWO_FIXTURE_BLUEPRINT,
  };
};
