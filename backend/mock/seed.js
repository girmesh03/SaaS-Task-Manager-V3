/**
 * @file Phase 2 seed script for platform baseline bootstrap.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import Department from "../models/Department.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { USER_ROLES } from "../utils/constants.js";
import { getPlatformSeedFromEnv } from "./data.js";

dotenv.config();

const restoreIfDeleted = async (document) => {
  if (!document || !document.isDeleted) {
    return document;
  }

  document.isDeleted = false;
  document.deletedAt = null;
  document.deletedBy = null;
  await document.save();
  return document;
};

const ensurePlatformBaseline = async () => {
  const seedPayload = getPlatformSeedFromEnv(process.env);
  const seedUserId = new mongoose.Types.ObjectId();

  let organization = await Organization.findOne({ isPlatformOrg: true }).withDeleted();
  if (!organization) {
    organization = await Organization.create({
      name: seedPayload.organization.name,
      description: seedPayload.organization.description,
      email: seedPayload.organization.email,
      phone: seedPayload.organization.phone,
      address: seedPayload.organization.address,
      size: seedPayload.organization.size,
      industry: seedPayload.organization.industry,
      isPlatformOrg: true,
      isVerified: true,
      verifiedAt: new Date(),
      createdBy: null,
    });
  } else {
    await restoreIfDeleted(organization);
  }

  let department = await Department.findOne({
    organization: organization._id,
    name: seedPayload.department.name,
  }).withDeleted();

  if (!department) {
    department = await Department.create({
      organization: organization._id,
      name: seedPayload.department.name,
      description: seedPayload.department.description,
      status: "ACTIVE",
      manager: null,
      createdBy: seedUserId,
    });
  } else {
    await restoreIfDeleted(department);
  }

  let user = await User.findOne({
    organization: organization._id,
    email: seedPayload.user.email,
  })
    .withDeleted()
    .select("+password");

  if (!user) {
    user = await User.create({
      _id: seedUserId,
      firstName: seedPayload.user.firstName,
      lastName: seedPayload.user.lastName,
      position: seedPayload.user.position,
      email: seedPayload.user.email,
      password: seedPayload.user.password,
      role: seedPayload.user.role || USER_ROLES.SUPER_ADMIN,
      organization: organization._id,
      department: department._id,
      isPlatformOrgUser: true,
      isHod: true,
      isVerified: true,
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
      createdBy: seedUserId,
    });
  } else {
    await restoreIfDeleted(user);
  }

  if (!department.manager || department.manager.toString() !== user._id.toString()) {
    department.manager = user._id;
    department.createdBy = department.createdBy || user._id;
    await department.save();
  }

  organization.createdBy = user._id;
  organization.isVerified = true;
  organization.verifiedAt = organization.verifiedAt || new Date();
  await organization.save();

  logger.info("Platform baseline seeded", {
    organizationId: organization._id.toString(),
    departmentId: department._id.toString(),
    userId: user._id.toString(),
  });
};

const runSeed = async () => {
  await connectDB();
  await ensurePlatformBaseline();
};

runSeed()
  .then(async () => {
    await disconnectDB();
    logger.info("Seed script completed successfully");
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error("Seed script failed", {
      message: error.message,
      stack: error.stack,
    });

    await disconnectDB();
    process.exit(1);
  });
