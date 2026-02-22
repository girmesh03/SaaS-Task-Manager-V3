/**
 * @file Phase 4 manual fixtures (vendors/materials/users) for UI verification.
 *
 * Usage:
 *   node backend/tests/phase4/seed-phase4-fixtures.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB, disconnectDB } from "../../config/db.js";
import {
  Department,
  Material,
  Organization,
  User,
  Vendor,
} from "../../models/index.js";
import {
  DEPARTMENT_STATUS,
  MATERIAL_STATUS,
  USER_ROLES,
  USER_STATUS,
  VENDOR_STATUS,
} from "../../utils/constants.js";
import { isDevelopmentEnv } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const assertDevelopmentRuntime = (env = process.env) => {
  if (!isDevelopmentEnv(env)) {
    throw new Error("Phase 4 fixtures script is allowed only in development mode");
  }
};

const upsertOrganization = async ({ session }) => {
  const email = "phase4-demo-org@gmail.com";
  let organization = await Organization.findOne({ email }).withDeleted().session(session);

  if (!organization) {
    organization = new Organization({
      name: "Phase 4 Demo Org",
      description: "Fixtures organization for Phase 4 manual UI verification.",
      email,
      phone: "+251911111111",
      address: "Addis Ababa",
      industry: "Technology",
      size: "Small",
      isVerified: true,
      verifiedAt: new Date(),
      createdBy: null,
    });
  } else if (organization.isDeleted) {
    organization.isDeleted = false;
    organization.deletedAt = null;
    organization.deletedBy = null;
  }

  organization.isVerified = true;
  organization.verifiedAt = organization.verifiedAt || new Date();
  await organization.save({ session });

  return organization;
};

const upsertDepartmentAndAdmin = async ({ organization, session }) => {
  const adminId = new mongoose.Types.ObjectId();
  const departmentId = new mongoose.Types.ObjectId();

  let department = await Department.findOne({
    organization: organization._id,
    name: "Operations",
  })
    .withDeleted()
    .session(session);

  if (!department) {
    department = new Department({
      _id: departmentId,
      organization: organization._id,
      name: "Operations",
      description: "Operations department for Phase 4 fixtures.",
      status: DEPARTMENT_STATUS.ACTIVE,
      manager: adminId,
      createdBy: adminId,
    });
  } else {
    if (department.isDeleted) {
      department.isDeleted = false;
      department.deletedAt = null;
      department.deletedBy = null;
    }
    department.status = DEPARTMENT_STATUS.ACTIVE;
  }

  await department.save({ session });

  const adminEmail = "phase4.admin@gmail.com";
  let admin = await User.findOne({
    organization: organization._id,
    email: adminEmail,
  })
    .withDeleted()
    .select("+password")
    .session(session);

  if (!admin) {
    admin = new User({
      _id: adminId,
      firstName: "Phase4",
      lastName: "Admin",
      position: "Admin",
      email: adminEmail,
      password: "12345678",
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      organization: organization._id,
      department: department._id,
      isVerified: true,
      emailVerifiedAt: new Date(),
      joinedAt: new Date(),
    });
  } else {
    if (admin.isDeleted) {
      admin.isDeleted = false;
      admin.deletedAt = null;
      admin.deletedBy = null;
    }
    admin.password = "12345678";
    admin.role = USER_ROLES.ADMIN;
    admin.status = USER_STATUS.ACTIVE;
    admin.department = department._id;
    admin.organization = organization._id;
    admin.isVerified = true;
    admin.emailVerifiedAt = admin.emailVerifiedAt || new Date();
  }

  await admin.save({ session });

  department.manager = admin._id;
  department.createdBy = admin._id;
  await department.save({ session });

  return { department, admin };
};

const upsertUsers = async ({ organization, department, session }) => {
  const users = [
    { email: "phase4.user1@gmail.com", firstName: "Phase4", lastName: "User1" },
    { email: "phase4.user2@gmail.com", firstName: "Phase4", lastName: "User2" },
    { email: "phase4.user3@gmail.com", firstName: "Phase4", lastName: "User3" },
  ];

  const created = [];
  for (const entry of users) {
    let user = await User.findOne({ organization: organization._id, email: entry.email })
      .withDeleted()
      .select("+password")
      .session(session);

    if (!user) {
      user = new User({
        firstName: entry.firstName,
        lastName: entry.lastName,
        position: "Staff",
        email: entry.email,
        password: "12345678",
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE,
        organization: organization._id,
        department: department._id,
        isVerified: true,
        emailVerifiedAt: new Date(),
        joinedAt: new Date(),
      });
    } else {
      if (user.isDeleted) {
        user.isDeleted = false;
        user.deletedAt = null;
        user.deletedBy = null;
      }
      user.password = "12345678";
      user.status = USER_STATUS.ACTIVE;
      user.department = department._id;
      user.organization = organization._id;
      user.isVerified = true;
      user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    }

    await user.save({ session });
    created.push(user);
  }

  return created;
};

const upsertVendors = async ({ organization, createdBy, session }) => {
  const vendorNames = ["Acme Supplies", "Blue Nile Logistics", "Horizon Contractors"];
  const vendors = [];

  for (const name of vendorNames) {
    let vendor = await Vendor.findOne({ organization: organization._id, name })
      .withDeleted()
      .session(session);

    if (!vendor) {
      vendor = new Vendor({
        name,
        email: `${name.toLowerCase().replace(/\\s+/g, ".")}@gmail.com`,
        phone: "+251933333333",
        website: "",
        location: "Addis Ababa",
        address: "Addis Ababa",
        description: "Phase 4 demo vendor.",
        status: VENDOR_STATUS.ACTIVE,
        isVerifiedPartner: false,
        rating: null,
        organization: organization._id,
        createdBy,
      });
    } else {
      if (vendor.isDeleted) {
        vendor.isDeleted = false;
        vendor.deletedAt = null;
        vendor.deletedBy = null;
      }
      vendor.status = VENDOR_STATUS.ACTIVE;
      vendor.createdBy = createdBy;
    }

    await vendor.save({ session });
    vendors.push(vendor);
  }

  return vendors;
};

const upsertMaterials = async ({ organization, department, createdBy, session }) => {
  const materials = [
    { sku: "PH4-GLV", name: "Safety Gloves", unit: "pair", price: 8, stockOnHand: 50 },
    { sku: "PH4-MSK", name: "Dust Masks", unit: "box", price: 12, stockOnHand: 30 },
    { sku: "PH4-TPE", name: "Tape Roll", unit: "roll", price: 4, stockOnHand: 100 },
  ];

  const created = [];
  for (const entry of materials) {
    let material = await Material.findOne({
      organization: organization._id,
      department: department._id,
      sku: entry.sku,
    })
      .withDeleted()
      .session(session);

    if (!material) {
      material = new Material({
        name: entry.name,
        sku: entry.sku,
        status: MATERIAL_STATUS.ACTIVE,
        description: "Phase 4 demo material.",
        unit: entry.unit,
        category: "Other",
        price: entry.price,
        inventory: {
          stockOnHand: entry.stockOnHand,
          lowStockThreshold: 5,
          reorderQuantity: 10,
          lastRestockedAt: null,
        },
        organization: organization._id,
        department: department._id,
        createdBy,
      });
    } else {
      if (material.isDeleted) {
        material.isDeleted = false;
        material.deletedAt = null;
        material.deletedBy = null;
      }
      material.status = MATERIAL_STATUS.ACTIVE;
      material.price = entry.price;
      material.unit = entry.unit;
      material.inventory.stockOnHand = entry.stockOnHand;
      material.createdBy = createdBy;
    }

    await material.save({ session });
    created.push(material);
  }

  return created;
};

const main = async () => {
  assertDevelopmentRuntime();

  await connectDB();
  logger.info("Connected to DB for phase 4 fixtures");

  try {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const organization = await upsertOrganization({ session });
      const { department, admin } = await upsertDepartmentAndAdmin({ organization, session });
      await upsertUsers({ organization, department, session });
      await upsertVendors({ organization, createdBy: admin._id, session });
      await upsertMaterials({
        organization,
        department,
        createdBy: admin._id,
        session,
      });

      logger.info("Phase 4 fixtures ensured", {
        organizationId: String(organization._id),
        departmentId: String(department._id),
        adminEmail: admin.email,
        adminPassword: "12345678",
      });
    });
    session.endSession();
  } finally {
    await disconnectDB();
    logger.info("Disconnected DB for phase 4 fixtures");
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("seed-phase4-fixtures.js failed", error);
  process.exit(1);
});
