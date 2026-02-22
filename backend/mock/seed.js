/**
 * @file Development seed script for Phase 4 mock data (org/dept/users + tasks vertical slice).
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { Department, Organization, User } from "../models/index.js";
import { DEPARTMENT_STATUS, USER_STATUS } from "../utils/constants.js";
import { withMongoTransaction } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import { getPhaseThreeSeedBlueprint } from "./data.js";
import { assertDevelopmentRuntime, wipeDatabase } from "./dbUtils.js";
import { seedPhaseFourForOrganization } from "./phase4Seed.js";

dotenv.config();

/**
 * Restores a soft-deleted document in-place.
 *
 * @param {import("mongoose").Document & { isDeleted?: boolean; deletedAt?: Date | null; deletedBy?: unknown }} doc - Target document.
 * @param {import("mongoose").ClientSession} session - Active session.
 * @returns {Promise<void>}
 */
const restoreSoftDeleted = async (doc, session) => {
  if (!doc || !doc.isDeleted) {
    return;
  }

  doc.isDeleted = false;
  doc.deletedAt = null;
  doc.deletedBy = null;
  await doc.save({ session });
};

/**
 * Pads a sequence into 4-digit employee id.
 *
 * @param {number} value - Sequence number.
 * @returns {string} Employee id string.
 */
const toEmployeeId = (value) => {
  return String(value).padStart(4, "0");
};

/**
 * Upserts mock data for one organization blueprint.
 *
 * @param {{
 *   key: string;
 *   payload: Record<string, unknown>;
 *   departments: Array<{ key: string; name: string; description: string; status: string }>;
 *   users: Array<{
 *     firstName: string;
 *     lastName: string;
 *     position: string;
 *     role: string;
 *     isHod: boolean;
 *     departmentKey: string;
 *     isPlatformOrgUser: boolean;
 *     email: string;
 *     password: string;
 *     status: string;
 *     joinedAt: string;
 *   }>;
 * }} organizationBlueprint - Organization blueprint.
 * @param {import("mongoose").ClientSession} session - Active transaction session.
 * @returns {Promise<{ organization: import("mongoose").Document; departmentMap: Map<string, import("mongoose").Document>; users: import("mongoose").Document[] }>}
 */
const upsertOrganizationBlueprint = async (organizationBlueprint, session) => {
  const { payload, departments, users } = organizationBlueprint;
  const seedActorId = new mongoose.Types.ObjectId();

  let organization = await Organization.findOne({ name: payload.name })
    .withDeleted()
    .session(session);

  if (!organization) {
    organization = new Organization({
      ...payload,
      createdBy: null,
      verifiedAt: new Date(),
    });
  } else {
    await restoreSoftDeleted(organization, session);
    organization.name = payload.name;
    organization.description = payload.description;
    organization.email = payload.email;
    organization.phone = payload.phone;
    organization.address = payload.address;
    organization.industry = payload.industry;
    organization.size = payload.size;
    organization.isPlatformOrg = Boolean(payload.isPlatformOrg);
    organization.isVerified = true;
    organization.verifiedAt = organization.verifiedAt || new Date();
  }

  await organization.save({ session });

  const departmentMap = new Map();
  for (const departmentBlueprint of departments) {
    let department = await Department.findOne({
      organization: organization._id,
      name: departmentBlueprint.name,
    })
      .withDeleted()
      .session(session);

    if (!department) {
      department = new Department({
        organization: organization._id,
        name: departmentBlueprint.name,
        description: departmentBlueprint.description,
        status: departmentBlueprint.status || DEPARTMENT_STATUS.ACTIVE,
        manager: null,
        createdBy: seedActorId,
      });
    } else {
      await restoreSoftDeleted(department, session);
      department.description = departmentBlueprint.description;
      department.status = departmentBlueprint.status || DEPARTMENT_STATUS.ACTIVE;
      department.createdBy = department.createdBy || seedActorId;
    }

    await department.save({ session });
    departmentMap.set(departmentBlueprint.key, department);
  }

  const userDocuments = [];
  let createdByUserId = null;
  let employeeSequence = 1;

  for (const userBlueprint of users) {
    const targetDepartment = departmentMap.get(userBlueprint.departmentKey);
    if (!targetDepartment) {
      throw new Error(
        `Missing department '${userBlueprint.departmentKey}' for user ${userBlueprint.email}`
      );
    }

    let user = await User.findOne({
      organization: organization._id,
      email: userBlueprint.email,
    })
      .withDeleted()
      .select("+password")
      .session(session);

    const resolvedUserId =
      user?._id || (userDocuments.length === 0 ? seedActorId : new mongoose.Types.ObjectId());
    const nextEmployeeId = toEmployeeId(employeeSequence);
    employeeSequence += 1;

    if (!user) {
      user = new User({
        _id: resolvedUserId,
        firstName: userBlueprint.firstName,
        lastName: userBlueprint.lastName,
        position: userBlueprint.position,
        email: userBlueprint.email,
        password: userBlueprint.password,
        role: userBlueprint.role,
        status: userBlueprint.status || USER_STATUS.ACTIVE,
        organization: organization._id,
        department: targetDepartment._id,
        isHod: Boolean(userBlueprint.isHod),
        isPlatformOrgUser: Boolean(userBlueprint.isPlatformOrgUser),
        isVerified: true,
        emailVerifiedAt: new Date(),
        joinedAt: new Date(userBlueprint.joinedAt),
        createdBy: createdByUserId || resolvedUserId,
        employeeId: nextEmployeeId,
      });
    } else {
      await restoreSoftDeleted(user, session);
      user.firstName = userBlueprint.firstName;
      user.lastName = userBlueprint.lastName;
      user.position = userBlueprint.position;
      user.password = userBlueprint.password;
      user.role = userBlueprint.role;
      user.status = userBlueprint.status || USER_STATUS.ACTIVE;
      user.organization = organization._id;
      user.department = targetDepartment._id;
      user.isHod = Boolean(userBlueprint.isHod);
      user.isPlatformOrgUser = Boolean(userBlueprint.isPlatformOrgUser);
      user.isVerified = true;
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
      user.joinedAt = new Date(userBlueprint.joinedAt);
      user.createdBy = createdByUserId || resolvedUserId;
      user.employeeId = nextEmployeeId;
    }

    await user.save({ session });

    if (!createdByUserId) {
      createdByUserId = user._id;
    }

    userDocuments.push(user);
  }

  for (const departmentBlueprint of departments) {
    const department = departmentMap.get(departmentBlueprint.key);
    if (!department) {
      continue;
    }

    const hod = userDocuments.find(
      (entry) =>
        String(entry.department) === String(department._id) && Boolean(entry.isHod)
    );
    if (hod) {
      department.manager = hod._id;
      department.createdBy = createdByUserId || hod._id;
    } else if (!department.createdBy) {
      department.createdBy = createdByUserId;
    }

    await department.save({ session });
  }

  organization.createdBy = createdByUserId || organization.createdBy;
  organization.isVerified = true;
  organization.verifiedAt = organization.verifiedAt || new Date();
  await organization.save({ session });

  return {
    organization,
    departmentMap,
    users: userDocuments,
  };
};

/**
 * Executes full Phase 4 seed (wipe + orgs + phase4 fixtures).
 *
 * @returns {Promise<void>}
 */
const runSeed = async () => {
  assertDevelopmentRuntime(process.env);
  await connectDB();

  try {
    const wipeResult = await wipeDatabase();
    logger.info("Development wipe completed (seed pre-step)", wipeResult);

    const blueprint = getPhaseThreeSeedBlueprint(process.env);

    const totals = {
      organizations: 0,
      vendors: 0,
      materials: 0,
      tasks: 0,
      activities: 0,
      comments: 0,
      attachments: 0,
      notifications: 0,
    };

    for (const organizationBlueprint of blueprint.organizations) {
      // Keep each organization seed within its own transaction to avoid long-running transactions.
      // eslint-disable-next-line no-await-in-loop
      const seededResult = await withMongoTransaction(async (session) => {
        const seeded = await upsertOrganizationBlueprint(organizationBlueprint, session);

        if (!seeded.organization?.isPlatformOrg) {
          const phaseFourSummary = await seedPhaseFourForOrganization({
            organization: seeded.organization,
            departments: Array.from(seeded.departmentMap.values()),
            users: seeded.users,
            session,
          });

          return { seeded, phaseFourSummary };
        }

        return { seeded, phaseFourSummary: null };
      });

      totals.organizations += 1;

      if (seededResult.phaseFourSummary) {
        totals.vendors += seededResult.phaseFourSummary.vendors;
        totals.materials += seededResult.phaseFourSummary.materials;
        totals.tasks += seededResult.phaseFourSummary.tasks;
        totals.activities += seededResult.phaseFourSummary.activities;
        totals.comments += seededResult.phaseFourSummary.comments;
        totals.attachments += seededResult.phaseFourSummary.attachments;
        totals.notifications += seededResult.phaseFourSummary.notifications;
      }
    }

    logger.info("Phase 4 development seed completed", totals);
  } finally {
    await disconnectDB();
  }
};

runSeed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Seed script failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
