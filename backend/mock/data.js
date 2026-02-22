/**
 * @file Development mock-seed blueprints for Phase 3 organizations/departments/users.
 */
import {
  DEPARTMENT_STATUS,
  MOCK_DEFAULTS,
  NODE_ENVS,
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_SIZES,
  USER_ROLES,
  USER_STATUS,
} from "../utils/constants.js";
import {
  isDevelopmentEnv,
  toGmailAddress,
  toISODateTime,
} from "../utils/helpers.js";

/**
 * Environment variable keys used for platform seed inputs.
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
 * Resolves platform seed values from environment.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Source environment object.
 * @returns {{
 *   organization: {
 *     name: string;
 *     description: string;
 *     email: string;
 *     phone: string;
 *     address: string;
 *     industry: string;
 *     size: string;
 *   };
 *   department: { name: string; description: string };
 *   user: {
 *     firstName: string;
 *     lastName: string;
 *     position: string;
 *     role: string;
 *     email: string;
 *     password: string;
 *   };
 * }} Platform seed payload.
 */
export const getPlatformSeedFromEnv = (env = process.env) => {
  const organizationName = env.PLATFORM_ORGANIZATION_NAME || "Task Manager";
  const platformFirstName = env.PLATFORM_ADMIN_FIRST_NAME || "Platform";
  const useDevPassword = isDevelopmentEnv(env);

  return {
    organization: {
      name: organizationName,
      description:
        env.PLATFORM_ORGANIZATION_DESCRIPTION ||
        "Task Manager is a multi-tenant SaaS application specifically designed for an industry structured as organizations, departments, and users.",
      email:
        env.PLATFORM_ORGANIZATION_EMAIL ||
        toGmailAddress(
          organizationName.split(" ")[0],
          MOCK_DEFAULTS.GMAIL_DOMAIN
        ),
      phone: env.PLATFORM_ORGANIZATION_PHONE || "+251913050675",
      address: env.PLATFORM_ORGANIZATION_ADDRESS || "Head Office, Addis Ababa",
      industry:
        env.PLATFORM_ORGANIZATION_INDUSTRY ||
        ORGANIZATION_INDUSTRIES.find((value) => value === "Technology") ||
        ORGANIZATION_INDUSTRIES[0],
      size:
        env.PLATFORM_ORGANIZATION_SIZE ||
        ORGANIZATION_SIZES.find((value) => value === "Small") ||
        ORGANIZATION_SIZES[0],
    },
    department: {
      name: env.PLATFORM_DEPARTMENT_NAME || "Administration",
      description:
        env.PLATFORM_DEPARTMENT_DESCRIPTION ||
        "Platform administration and governance operations.",
    },
    user: {
      firstName: platformFirstName,
      lastName: env.PLATFORM_ADMIN_LAST_NAME || "Superadmin",
      position: env.PLATFORM_ADMIN_POSITION || "Platform Super Administrator",
      role: env.PLATFORM_ADMIN_ROLE || USER_ROLES.SUPER_ADMIN,
      email:
        env.PLATFORM_ADMIN_EMAIL ||
        toGmailAddress(platformFirstName, MOCK_DEFAULTS.GMAIL_DOMAIN),
      password: useDevPassword
        ? MOCK_DEFAULTS.PASSWORD
        : env.PLATFORM_ADMIN_PASSWORD || MOCK_DEFAULTS.PASSWORD,
    },
  };
};

/**
 * Builds deterministic Phase 3 seed blueprint (platform + customer organizations).
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - Source environment object.
 * @returns {{
 *   generatedAt: string;
 *   organizations: Array<{
 *     key: string;
 *     payload: {
 *       name: string;
 *       description: string;
 *       email: string;
 *       phone: string;
 *       address: string;
 *       industry: string;
 *       size: string;
 *       isPlatformOrg: boolean;
 *       isVerified: boolean;
 *     };
 *     departments: Array<{
 *       key: string;
 *       name: string;
 *       description: string;
 *       status: string;
 *     }>;
 *     users: Array<{
 *       firstName: string;
 *       lastName: string;
 *       position: string;
 *       role: string;
 *       isHod: boolean;
 *       departmentKey: string;
 *       isPlatformOrgUser: boolean;
 *       email: string;
 *       password: string;
 *       status: string;
 *       joinedAt: string;
 *     }>;
 *   }>;
 * }} Seed blueprint.
 */
export const getPhaseThreeSeedBlueprint = (env = process.env) => {
  const platformSeed = getPlatformSeedFromEnv(env);
  const password = isDevelopmentEnv(env)
    ? MOCK_DEFAULTS.PASSWORD
    : env.PLATFORM_ADMIN_PASSWORD || MOCK_DEFAULTS.PASSWORD;
  const joinedAt = toISODateTime();

  return {
    generatedAt: joinedAt,
    organizations: [
      {
        key: "platform_task_manager",
        payload: {
          ...platformSeed.organization,
          isPlatformOrg: true,
          isVerified: true,
        },
        departments: [
          {
            key: "platform_administration",
            name: platformSeed.department.name,
            description: platformSeed.department.description,
            status: DEPARTMENT_STATUS.ACTIVE,
          },
        ],
        users: [
          {
            firstName: platformSeed.user.firstName,
            lastName: platformSeed.user.lastName,
            position: platformSeed.user.position,
            role: platformSeed.user.role,
            isHod: true,
            departmentKey: "platform_administration",
            isPlatformOrgUser: true,
            email: toGmailAddress(
              platformSeed.user.firstName,
              MOCK_DEFAULTS.GMAIL_DOMAIN
            ),
            password: platformSeed.user.password || password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Taskmanager",
            lastName: "Manager",
            position: "Assistant Platform Manager",
            role: USER_ROLES.MANAGER,
            isHod: false,
            departmentKey: "platform_administration",
            isPlatformOrgUser: true,
            email: toGmailAddress("Taskmanager", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Platformuserone",
            lastName: "Operator",
            position: "Support Specialist",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "platform_administration",
            isPlatformOrgUser: true,
            email: toGmailAddress(
              "Platformuserone",
              MOCK_DEFAULTS.GMAIL_DOMAIN
            ),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Platformusertwo",
            lastName: "Operator",
            position: "Support Specialist",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "platform_administration",
            isPlatformOrgUser: true,
            email: toGmailAddress(
              "Platformusertwo",
              MOCK_DEFAULTS.GMAIL_DOMAIN
            ),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Platformuserthree",
            lastName: "Operator",
            position: "Support Specialist",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "platform_administration",
            isPlatformOrgUser: true,
            email: toGmailAddress(
              "Platformuserthree",
              MOCK_DEFAULTS.GMAIL_DOMAIN
            ),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
        ],
      },
      {
        key: "customer_elilly",
        payload: {
          name: "Elilly International Hotel",
          description: "5-star luxury hotel with 154 rooms and 5 restaurants",
          email: toGmailAddress("elilly", MOCK_DEFAULTS.GMAIL_DOMAIN),
          phone: "+251115587777",
          address: "Addis Ababa, Kazanchis Area, Kirkos Subcity 17/18",
          industry: "Hospitality",
          size: "Large",
          isPlatformOrg: false,
          isVerified: true,
        },
        departments: [
          {
            key: "elilly_engineering",
            name: "Engineering",
            description: "Engineering operations department",
            status: DEPARTMENT_STATUS.ACTIVE,
          },
          {
            key: "elilly_housekeeping",
            name: "Housekeeping",
            description: "Housekeeping operations department",
            status: DEPARTMENT_STATUS.ACTIVE,
          },
        ],
        users: [
          {
            firstName: "Girmachew",
            lastName: "Zewdie",
            position: "Chief Engineer",
            role: USER_ROLES.SUPER_ADMIN,
            isHod: true,
            departmentKey: "elilly_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("girmazewdei38", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Ashenafi",
            lastName: "Abeje",
            position: "Assistant Chief Engineer",
            role: USER_ROLES.MANAGER,
            isHod: false,
            departmentKey: "elilly_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Ashenafi", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Taye",
            lastName: "Kebede",
            position: "Plumber",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "elilly_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Taye", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Bisrat",
            lastName: "Ayele",
            position: "Electrician",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "elilly_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Bisrat", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Dawit",
            lastName: "Getachew",
            position: "HVAC Technician",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "elilly_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Dawit", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Seble",
            lastName: "Tefera",
            position: "Director of Housekeeping",
            role: USER_ROLES.ADMIN,
            isHod: true,
            departmentKey: "elilly_housekeeping",
            isPlatformOrgUser: false,
            email: toGmailAddress("Seble", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Chala",
            lastName: "Kebede",
            position: "Assistant Director of Housekeeping",
            role: USER_ROLES.MANAGER,
            isHod: false,
            departmentKey: "elilly_housekeeping",
            isPlatformOrgUser: false,
            email: toGmailAddress("Chala", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Beshenena",
            lastName: "Beshu",
            position: "Supervisor",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "elilly_housekeeping",
            isPlatformOrgUser: false,
            email: toGmailAddress("Beshenena", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Hiwot",
            lastName: "Ayele",
            position: "Housekeeper",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "elilly_housekeeping",
            isPlatformOrgUser: false,
            email: toGmailAddress("Hiwot", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Martha",
            lastName: "Tsegaye",
            position: "Laundry Attendant",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "elilly_housekeeping",
            isPlatformOrgUser: false,
            email: toGmailAddress("Martha", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
        ],
      },
      {
        key: "customer_capital",
        payload: {
          name: "Capital Hotel & Spa",
          description: "Boutique hotel with wellness center and fine dining",
          email: toGmailAddress("capital", MOCK_DEFAULTS.GMAIL_DOMAIN),
          phone: "+251117890123",
          address: "Addis Ababa, Megenagna, Near Friendship City Center",
          industry: "Hospitality",
          size: "Medium",
          isPlatformOrg: false,
          isVerified: true,
        },
        departments: [
          {
            key: "capital_engineering",
            name: "Engineering",
            description: "Engineering operations department",
            status: DEPARTMENT_STATUS.ACTIVE,
          },
        ],
        users: [
          {
            firstName: "Zewdu",
            lastName: "Megeresa",
            position: "Chief Engineer",
            role: USER_ROLES.SUPER_ADMIN,
            isHod: true,
            departmentKey: "capital_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Zewdu", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Yemam",
            lastName: "Ali",
            position: "Assistant Chief Engineer",
            role: USER_ROLES.MANAGER,
            isHod: false,
            departmentKey: "capital_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Yemam", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Abebe",
            lastName: "Kebede",
            position: "Electrician",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "capital_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Abebe", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Miky",
            lastName: "Sheraton",
            position: "Plumber",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "capital_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Miky", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
          {
            firstName: "Hanan",
            lastName: "Solomon",
            position: "Mechanical Technician",
            role: USER_ROLES.USER,
            isHod: false,
            departmentKey: "capital_engineering",
            isPlatformOrgUser: false,
            email: toGmailAddress("Hanan", MOCK_DEFAULTS.GMAIL_DOMAIN),
            password,
            status: USER_STATUS.ACTIVE,
            joinedAt,
          },
        ],
      },
    ],
  };
};

/**
 * Compatibility descriptor used by existing seed tooling.
 *
 * @returns {{ phase: "PHASE_3"; runtime: string }} Descriptor payload.
 */
export const getPhaseThreeDescriptor = () => {
  const runtime = String(
    process.env.NODE_ENV || NODE_ENVS.DEVELOPMENT
  ).toLowerCase();

  return {
    phase: "PHASE_3",
    runtime: Object.values(NODE_ENVS).includes(runtime)
      ? runtime
      : NODE_ENVS.DEVELOPMENT,
  };
};
