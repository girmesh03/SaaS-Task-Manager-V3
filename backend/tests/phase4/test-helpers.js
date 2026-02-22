/**
 * @file Phase 4 plain-JS backend test helpers.
 *
 * - No test frameworks (per steering rules).
 * - Use real Mongoose models + real DB connection.
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../../config/db.js";
import {
  Attachment,
  Department,
  Material,
  Notification,
  Organization,
  Task,
  TaskActivity,
  TaskComment,
  User,
  Vendor,
} from "../../models/index.js";
import {
  DEPARTMENT_STATUS,
  MATERIAL_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
  USER_ROLES,
  USER_STATUS,
  VENDOR_STATUS,
} from "../../utils/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};

export const buildReq = ({
  user = null,
  body = {},
  params = {},
  query = {},
  cookies = {},
} = {}) => {
  return {
    user,
    body,
    params,
    query,
    cookies,
    headers: {},
    validated: {
      body,
      params,
      query,
    },
  };
};

export const buildRes = () => {
  const res = {
    statusCode: 200,
    payload: null,
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    res.payload = payload;
    return res;
  };

  return res;
};

export const runController = async (controller, req) => {
  const res = buildRes();
  let capturedError = null;
  const next = (error) => {
    capturedError = error || new Error("next() called without error");
  };

  await controller(req, res, next);

  if (capturedError) {
    throw capturedError;
  }

  return res;
};

export const setupDb = async () => {
  await connectDB();
};

export const teardownDb = async () => {
  await disconnectDB();
};

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createPhase4Fixture = async ({ withSecondDepartmentUser = false } = {}) => {
  const suffix = uniqueSuffix();

  const organization = await Organization.create({
    name: `TEST-PHASE4-ORG-${suffix}`,
    description: "Phase 4 test organization",
    email: `phase4-org-${suffix}@gmail.com`,
    phone: "+251911111111",
    address: "Addis Ababa",
    industry: "Technology",
    size: "Small",
    isVerified: true,
    verifiedAt: new Date(),
    createdBy: null,
  });

  const departmentId = new mongoose.Types.ObjectId();
  const actorId = new mongoose.Types.ObjectId();

  const department = await Department.create({
    _id: departmentId,
    organization: organization._id,
    name: `TEST-PHASE4-DEPT-${suffix}`,
    description: "Phase 4 test department",
    status: DEPARTMENT_STATUS.ACTIVE,
    manager: actorId,
    createdBy: actorId,
  });

  const actor = await User.create({
    _id: actorId,
    firstName: "Phase",
    lastName: "Admin",
    position: "Admin",
    email: `phase4-admin-${suffix}@gmail.com`,
    password: "12345678",
    role: USER_ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    organization: organization._id,
    department: department._id,
    isVerified: true,
    emailVerifiedAt: new Date(),
    joinedAt: new Date(),
  });

  const watcher = await User.create({
    firstName: "Phase",
    lastName: "Watcher",
    position: "User",
    email: `phase4-watcher-${suffix}@gmail.com`,
    password: "12345678",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    organization: organization._id,
    department: department._id,
    isVerified: true,
    emailVerifiedAt: new Date(),
    joinedAt: new Date(),
  });

  const assignee = await User.create({
    firstName: "Phase",
    lastName: "Assignee",
    position: "User",
    email: `phase4-assignee-${suffix}@gmail.com`,
    password: "12345678",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    organization: organization._id,
    department: department._id,
    isVerified: true,
    emailVerifiedAt: new Date(),
    joinedAt: new Date(),
  });

  const mentionUser = await User.create({
    firstName: "Phase",
    lastName: "Mention",
    position: "User",
    email: `mention${suffix.replace(/[^a-z0-9]/gi, "")}@gmail.com`,
    password: "12345678",
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    organization: organization._id,
    department: department._id,
    isVerified: true,
    emailVerifiedAt: new Date(),
    joinedAt: new Date(),
  });

  const vendor = await Vendor.create({
    name: `TEST-VENDOR-${suffix}`,
    email: `vendor-${suffix}@gmail.com`,
    phone: "+251922222222",
    website: "",
    location: "Addis Ababa",
    address: "Addis Ababa",
    description: "Test vendor",
    status: VENDOR_STATUS.ACTIVE,
    isVerifiedPartner: false,
    rating: null,
    organization: organization._id,
    createdBy: actor._id,
  });

  const material = await Material.create({
    name: `TEST_MATERIAL_${suffix}`,
    sku: `SKU-${suffix.replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase()}`,
    status: MATERIAL_STATUS.ACTIVE,
    description: "Test material",
    unit: "pcs",
    category: "Other",
    price: 10,
    inventory: {
      stockOnHand: 20,
      lowStockThreshold: 5,
      reorderQuantity: 10,
      lastRestockedAt: null,
    },
    organization: organization._id,
    department: department._id,
    createdBy: actor._id,
  });

  const materialTwo = await Material.create({
    name: `TEST_MATERIAL_2_${suffix}`,
    sku: `SKU2-${suffix.replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase()}`,
    status: MATERIAL_STATUS.ACTIVE,
    description: "Test material 2",
    unit: "pcs",
    category: "Other",
    price: 5,
    inventory: {
      stockOnHand: 5,
      lowStockThreshold: 2,
      reorderQuantity: 5,
      lastRestockedAt: null,
    },
    organization: organization._id,
    department: department._id,
    createdBy: actor._id,
  });

  const secondDepartmentContext = {};
  if (withSecondDepartmentUser) {
    const secondDepartmentId = new mongoose.Types.ObjectId();
    const secondUserId = new mongoose.Types.ObjectId();

    const secondDepartment = await Department.create({
      _id: secondDepartmentId,
      organization: organization._id,
      name: `TEST-PHASE4-DEPT-2-${suffix}`,
      description: "Phase 4 test department 2",
      status: DEPARTMENT_STATUS.ACTIVE,
      manager: secondUserId,
      createdBy: secondUserId,
    });

    const secondUser = await User.create({
      _id: secondUserId,
      firstName: "Phase",
      lastName: "DeptTwo",
      position: "User",
      email: `phase4-dept2-${suffix}@gmail.com`,
      password: "12345678",
      role: USER_ROLES.USER,
      status: USER_STATUS.ACTIVE,
      organization: organization._id,
      department: secondDepartment._id,
      isVerified: true,
      emailVerifiedAt: new Date(),
      joinedAt: new Date(),
    });

    secondDepartmentContext.department = secondDepartment;
    secondDepartmentContext.user = secondUser;
  }

  return {
    suffix,
    organization,
    department,
    actor,
    watcher,
    assignee,
    mentionUser,
    vendor,
    material,
    materialTwo,
    secondDepartmentContext,
    defaults: {
      taskBase: {
        title: "Phase 4 Test Task",
        description: "A task created from phase 4 tests.",
        status: TASK_STATUS.TODO,
        priority: TASK_PRIORITY.MEDIUM,
      },
    },
  };
};

export const cleanupPhase4Fixture = async (fixture) => {
  const orgId = fixture?.organization?._id;
  if (!orgId) {
    return;
  }

  await Promise.all([
    Attachment.deleteMany({ organization: orgId }),
    Notification.deleteMany({ organization: orgId }),
    TaskComment.deleteMany({ organization: orgId }),
    TaskActivity.deleteMany({ organization: orgId }),
    Task.deleteMany({ organization: orgId }),
    Material.deleteMany({ organization: orgId }),
    Vendor.deleteMany({ organization: orgId }),
    User.deleteMany({ organization: orgId }),
    Department.deleteMany({ organization: orgId }),
    Organization.deleteMany({ _id: orgId }),
  ]);
};

export const createRoutineTaskDoc = async ({
  fixture,
  title = "Routine Task",
  quantity = 2,
  materialId = null,
  watcherIds = [],
} = {}) => {
  const material = materialId || fixture.material._id;

  const task = await Task.create({
    type: TASK_TYPE.ROUTINE,
    title,
    description: fixture.defaults.taskBase.description,
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    tags: [],
    watchers: watcherIds,
    organization: fixture.organization._id,
    department: fixture.department._id,
    createdBy: fixture.actor._id,
    date: new Date(),
    materials: [{ material, quantity }],
  });

  return task;
};

export const createProjectTaskDoc = async ({
  fixture,
  title = "Project Task",
  watcherIds = [],
} = {}) => {
  const task = await Task.create({
    type: TASK_TYPE.PROJECT,
    title,
    description: fixture.defaults.taskBase.description,
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    tags: [],
    watchers: watcherIds,
    organization: fixture.organization._id,
    department: fixture.department._id,
    createdBy: fixture.actor._id,
    vendor: fixture.vendor._id,
    startDate: new Date(Date.now() + 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });

  return task;
};

export const createAssignedTaskDoc = async ({
  fixture,
  title = "Assigned Task",
  assigneeIds = [],
  watcherIds = [],
} = {}) => {
  const task = await Task.create({
    type: TASK_TYPE.ASSIGNED,
    title,
    description: fixture.defaults.taskBase.description,
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    tags: [],
    watchers: watcherIds,
    assignees: assigneeIds,
    organization: fixture.organization._id,
    department: fixture.department._id,
    createdBy: fixture.actor._id,
    startDate: new Date(Date.now() + 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });

  return task;
};
