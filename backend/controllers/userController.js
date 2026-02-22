/**
 * @file User controllers (Phase 3).
 */
import asyncHandler from "express-async-handler";
import {
  Attachment,
  Department,
  Notification,
  Task,
  TaskActivity,
  TaskComment,
  User,
} from "../models/index.js";
import {
  DEPARTMENT_STATUS,
  HTTP_STATUS,
  PERFORMANCE_RANGES,
  TASK_STATUS,
  USER_IMMUTABLE_FIELDS,
  USER_ROLES,
  USER_STATUS,
} from "../utils/constants.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.js";
import { parsePagination, withMongoTransaction } from "../utils/helpers.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { createNotificationSafe } from "../services/notificationService.js";
import {
  emitToDepartment,
  emitToOrganization,
  emitToUser,
} from "../services/socketService.js";

const parseCsv = (value) =>
  value === undefined || value === null || value === ""
    ? []
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const normalizeEmail = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeId = (value) =>
  !value
    ? null
    : typeof value === "object" && typeof value.toString === "function"
    ? value.toString()
    : String(value);

const isPlatformSuperAdmin = (user) =>
  user?.role === USER_ROLES.SUPER_ADMIN && Boolean(user?.isPlatformOrgUser);

const mapDuplicateKeyError = (error) => {
  if (!error || error.code !== 11000) {
    return null;
  }

  const keys = Object.keys(error.keyPattern || {});
  if (keys.includes("email")) {
    return new ConflictError("User email already exists");
  }
  if (keys.includes("employeeId")) {
    return new ConflictError("Employee ID already exists");
  }
  return new ConflictError("User already exists");
};

const buildPaginationMeta = (result) => ({
  totalDocs: result.totalDocs || 0,
  totalItems: result.totalDocs || 0,
  limit: result.limit || 20,
  page: result.page || 1,
  totalPages: result.totalPages || 1,
  hasNextPage: Boolean(result.hasNextPage),
  hasPrevPage: Boolean(result.hasPrevPage),
});

const ensureOrgScopeQuery = (reqUser, organizationId) => {
  if (!organizationId) {
    return normalizeId(reqUser.organization);
  }

  if (!isPlatformSuperAdmin(reqUser)) {
    throw new ValidationError(
      "organizationId query is only allowed for platform SuperAdmin users"
    );
  }

  return normalizeId(organizationId);
};

const enforceReadScope = (reqUser, targetUser) => {
  // Platform SuperAdmins can read any user across all organizations
  if (isPlatformSuperAdmin(reqUser)) {
    return;
  }

  // Enforce same organization for all non-platform users
  const reqOrgId = normalizeId(reqUser.organization);
  const targetOrgId = normalizeId(
    targetUser.organization?._id || targetUser.organization
  );

  if (reqOrgId !== targetOrgId) {
    throw new UnauthorizedError("Cross-organization access is not allowed");
  }

  // SuperAdmins and Admins can read users across departments in their own organization
  if ([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(reqUser.role)) {
    return;
  }

  // Managers and Users can only read users in their own department (or themselves)
  const targetDeptId = normalizeId(
    targetUser.department?._id || targetUser.department
  );

  if (
    normalizeId(reqUser.id) !== normalizeId(targetUser._id) &&
    normalizeId(reqUser.department) !== targetDeptId
  ) {
    throw new UnauthorizedError("Cross-department access is not allowed");
  }
};

const toUserSummary = (user) => {
  const organization = user.organization || {};
  const department = user.department || {};
  const profilePicture = user.profilePicture || {};

  return {
    id: normalizeId(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.email,
    phone: user.phone || "",
    position: user.position || "",
    role: user.role,
    status: user.status,
    isHod: Boolean(user.isHod),
    isPlatformOrgUser: Boolean(user.isPlatformOrgUser),
    employeeId: user.employeeId || "",
    joinedAt: user.joinedAt || null,
    dateOfBirth: user.dateOfBirth || null,
    skills: Array.isArray(user.skills) ? user.skills : [],
    preferences: user.preferences || null,
    security: user.security || null,
    profilePicture: profilePicture.url
      ? {
          url: profilePicture.url,
          publicId: profilePicture.publicId || "",
        }
      : null,
    organization: {
      id: normalizeId(organization._id || organization.id || user.organization),
      name: organization.name || "",
    },
    department: {
      id: normalizeId(department._id || department.id || user.department),
      name: department.name || "",
      status: department.status || "",
    },
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    isDeleted: Boolean(user.isDeleted),
  };
};

const buildDateRangeFilter = (from, to) => {
  if (!from && !to) {
    return null;
  }

  const range = {};
  if (from) {
    range.$gte = new Date(from);
  }
  if (to) {
    range.$lte = new Date(to);
  }

  if (range.$gte && range.$lte && range.$gte.getTime() > range.$lte.getTime()) {
    throw new ValidationError("Date range is invalid");
  }

  return range;
};

const loadDepartmentForWrite = async ({
  departmentId,
  organizationId,
  session = null,
}) => {
  const department = await Department.findById(departmentId)
    .withDeleted()
    .session(session);
  if (!department || department.isDeleted) {
    throw new NotFoundError("Department not found");
  }

  if (normalizeId(department.organization) !== normalizeId(organizationId)) {
    throw new ValidationError(
      "departmentId must belong to the active organization scope"
    );
  }

  if (department.status !== DEPARTMENT_STATUS.ACTIVE) {
    throw new ConflictError(
      "Cannot create users in an inactive department. Set department status to ACTIVE first."
    );
  }

  return department;
};

const createLifecycleNotification = async ({
  userId,
  organizationId,
  departmentId,
  title,
  message,
  entityModel = "User",
  entity = null,
  session = null,
}) => {
  await createNotificationSafe({
    title,
    message,
    user: userId,
    organization: organizationId,
    department: departmentId,
    entityModel,
    entity,
    session,
  });
};

const getPerformanceRangeStart = (range) => {
  const now = Date.now();
  const days = {
    [PERFORMANCE_RANGES[0]]: 7,
    [PERFORMANCE_RANGES[1]]: 30,
    [PERFORMANCE_RANGES[2]]: 180,
    [PERFORMANCE_RANGES[3]]: 90,
  };
  const selected = days[range] || days[PERFORMANCE_RANGES[1]];
  return new Date(now - selected * 24 * 60 * 60 * 1000);
};

/**
 * GET /api/users
 */
export const listUsers = asyncHandler(async (req, res, next) => {
  try {
    const query = req.validated.query;
    const pagination = parsePagination(query);
    const organizationId = ensureOrgScopeQuery(req.user, query.organizationId);
    const includeInactive =
      String(query.includeInactive || "false").toLowerCase() === "true";

    const filter = {
      organization: organizationId,
    };

    const roleFilter = parseCsv(query.role);
    if (roleFilter.length) {
      filter.role = { $in: roleFilter };
    }

    const statusFilter = parseCsv(query.status);
    if (statusFilter.length) {
      filter.status = { $in: statusFilter };
    } else if (!includeInactive) {
      filter.status = USER_STATUS.ACTIVE;
    }

    const departmentFilter = parseCsv(query.departmentId);
    if (departmentFilter.length) {
      filter.department = { $in: departmentFilter };
    }

    if ([USER_ROLES.MANAGER, USER_ROLES.USER].includes(req.user.role)) {
      filter.department = normalizeId(req.user.department);
    }

    if (query.employeeId) {
      filter.employeeId = String(query.employeeId).trim();
    }

    const joinedAtRange = buildDateRangeFilter(
      query.joinedFrom,
      query.joinedTo
    );
    if (joinedAtRange) {
      filter.joinedAt = joinedAtRange;
    }

    const paginationResult = await User.paginate(filter, {
      ...pagination.paginateOptions,
      populate: [
        { path: "department", select: "name status" },
        { path: "organization", select: "name" },
      ],
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        users: (paginationResult.docs || []).map((doc) => toUserSummary(doc)),
        pagination: buildPaginationMeta(paginationResult),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 */
export const createUser = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const organizationId = normalizeId(req.user.organization);
    const role = body.role || USER_ROLES.USER;
    const isHodEligible = [
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
    ];

    const { populated, createdUserId, createdDepartmentId, createdOrgId } =
      await withMongoTransaction(async (session) => {
        const department = await loadDepartmentForWrite({
          departmentId: body.departmentId,
          organizationId,
          session,
        });

        const email = normalizeEmail(body.email);
        const existingUser = await User.findOne({
          organization: organizationId,
          email,
        })
          .withDeleted()
          .session(session);
        if (existingUser) {
          throw new ConflictError("User email already exists");
        }

        if (body.employeeId) {
          const existingEmployeeId = await User.findOne({
            organization: organizationId,
            employeeId: String(body.employeeId).trim(),
          })
            .withDeleted()
            .session(session);
          if (existingEmployeeId) {
            throw new ConflictError("Employee ID already exists");
          }
        }

        const [user] = await User.create(
          [
            {
              firstName: body.firstName,
              lastName: body.lastName,
              position: body.position,
              email,
              password: body.password,
              phone: body.phone || undefined,
              role,
              status: body.status || USER_STATUS.ACTIVE,
              organization: organizationId,
              department: department._id,
              isHod: isHodEligible.includes(role) ? Boolean(body.isHod) : false,
              dateOfBirth: body.dateOfBirth || undefined,
              joinedAt: body.joinedAt || undefined,
              employeeId: body.employeeId || undefined,
              skills: Array.isArray(body.skills) ? body.skills : [],
              profilePicture: body.profilePicture || undefined,
              isVerified: true,
              emailVerifiedAt: new Date(),
              createdBy: req.user.id,
            },
          ],
          { session }
        );

        await createLifecycleNotification({
          userId: user._id,
          organizationId: user.organization,
          departmentId: user.department,
          title: "Welcome to TaskManager",
          message:
            "Your account has been created by your organization administrator.",
          entity: user._id,
          session,
        });

        const populated = await User.findById(user._id)
          .withDeleted()
          .populate("department", "name status")
          .populate("organization", "name")
          .session(session);

        return {
          populated,
          createdUserId: normalizeId(user._id),
          createdDepartmentId: normalizeId(user.department),
          createdOrgId: normalizeId(user.organization),
        };
      });

    await sendWelcomeEmail({
      to: populated.email,
      fullName: `${populated.firstName || ""} ${
        populated.lastName || ""
      }`.trim(),
    });

    await withMongoTransaction(async (session) => {
      await User.findByIdAndUpdate(
        createdUserId,
        { welcomeEmailSentAt: new Date() },
        { session }
      );
    });

    emitToOrganization({
      organizationId: createdOrgId,
      event: "user:created",
      payload: { user: toUserSummary(populated) },
    });
    emitToDepartment({
      departmentId: createdDepartmentId,
      event: "user:created",
      payload: { user: toUserSummary(populated) },
    });
    emitToUser({
      userId: createdUserId,
      event: "user:created",
      payload: { user: toUserSummary(populated) },
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "User created",
      data: {
        user: toUserSummary(populated),
      },
    });
  } catch (error) {
    next(mapDuplicateKeyError(error) || error);
  }
});

/**
 * GET /api/users/:userId
 */
export const getUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.validated.params.userId;
    const user = await User.findById(userId)
      .withDeleted()
      .populate("department", "name status")
      .populate("organization", "name");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    enforceReadScope(req.user, user);

    const assignedFilter = {
      organization: user.organization?._id || user.organization,
      department: user.department?._id || user.department,
      assignees: user._id,
      isDeleted: false,
    };
    const createdFilter = {
      organization: user.organization?._id || user.organization,
      department: user.department?._id || user.department,
      createdBy: user._id,
      isDeleted: false,
    };

    const [assignedTasks, createdTasks, completedTasks, overdueTasks] =
      await Promise.all([
        Task.countDocuments(assignedFilter),
        Task.countDocuments(createdFilter),
        Task.countDocuments({
          ...assignedFilter,
          status: TASK_STATUS.COMPLETED,
        }),
        Task.countDocuments({
          ...assignedFilter,
          status: { $ne: TASK_STATUS.COMPLETED },
          dueDate: { $lt: new Date() },
        }),
      ]);

    const totalTasks = assignedTasks + createdTasks;
    const activeTasks = Math.max(totalTasks - completedTasks, 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: toUserSummary(user),
        overviewAggregates: {
          totalTasks,
          assignedTasks,
          createdTasks,
          completedTasks,
          activeTasks,
          overdueTasks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:userId/activity
 */
export const getUserActivity = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.validated.params.userId;
    const query = req.validated.query;
    const pagination = parsePagination(query);

    const user = await User.findById(userId).withDeleted();
    if (!user) {
      throw new NotFoundError("User not found");
    }
    enforceReadScope(req.user, user);

    const dateRange = buildDateRangeFilter(query.from, query.to);
    const createdAtFilter = dateRange ? { createdAt: dateRange } : {};
    const requestedEntityModel = String(query.entityModel || "").trim();

    const [tasks, activities, comments, notifications] = await Promise.all([
      Task.find({
        createdBy: user._id,
        ...createdAtFilter,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("title type status createdAt"),
      TaskActivity.find({
        createdBy: user._id,
        ...createdAtFilter,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("activity parent parentModel createdAt"),
      TaskComment.find({
        createdBy: user._id,
        ...createdAtFilter,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("comment parent parentModel createdAt"),
      Notification.find({
        user: user._id,
        ...createdAtFilter,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("title message entity entityModel createdAt isRead"),
    ]);

    const items = [
      ...tasks.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "Task",
        entityId: normalizeId(item._id),
        title: "Task created",
        description: item.title,
        meta: item.status,
        createdAt: item.createdAt,
      })),
      ...activities.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "TaskActivity",
        entityId: normalizeId(item._id),
        title: "Task activity added",
        description: item.activity,
        meta: item.parentModel,
        createdAt: item.createdAt,
      })),
      ...comments.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "TaskComment",
        entityId: normalizeId(item._id),
        title: "Task comment added",
        description: item.comment,
        meta: item.parentModel,
        createdAt: item.createdAt,
      })),
      ...notifications.map((item) => ({
        id: normalizeId(item._id),
        entityModel: item.entityModel || "Notification",
        entityId: normalizeId(item.entity || item._id),
        title: item.title,
        description: item.message,
        meta: item.isRead ? "Read" : "Unread",
        createdAt: item.createdAt,
      })),
    ];

    const filtered = requestedEntityModel
      ? items.filter((item) => item.entityModel === requestedEntityModel)
      : items;

    const sorted = filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const totalDocs = sorted.length;
    const pageItems = sorted.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    );
    const totalPages = Math.max(Math.ceil(totalDocs / pagination.limit), 1);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        activities: pageItems,
        pagination: {
          totalDocs,
          totalItems: totalDocs,
          limit: pagination.limit,
          page: pagination.page,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:userId/performance
 */
export const getUserPerformance = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.validated.params.userId;
    const query = req.validated.query;
    const range = query.range || PERFORMANCE_RANGES[1];

    const user = await User.findById(userId).withDeleted();
    if (!user) {
      throw new NotFoundError("User not found");
    }
    enforceReadScope(req.user, user);

    const rangeStart = getPerformanceRangeStart(range);
    const orgId = user.organization;
    const deptId = user.department;

    const assignedFilter = {
      organization: orgId,
      department: deptId,
      assignees: user._id,
      createdAt: { $gte: rangeStart },
      isDeleted: false,
    };

    const [assignedTotal, assignedCompleted, completedTasks] =
      await Promise.all([
        Task.countDocuments(assignedFilter),
        Task.countDocuments({
          ...assignedFilter,
          status: TASK_STATUS.COMPLETED,
        }),
        Task.find({
          ...assignedFilter,
          status: TASK_STATUS.COMPLETED,
        }).select("createdAt updatedAt"),
      ]);

    const completionRate = assignedTotal
      ? Number(((assignedCompleted / assignedTotal) * 100).toFixed(2))
      : 0;

    const avgTaskTimeHours = completedTasks.length
      ? Number(
          (
            completedTasks.reduce((total, item) => {
              const createdAt = new Date(item.createdAt).getTime();
              const updatedAt = new Date(
                item.updatedAt || item.createdAt
              ).getTime();
              return total + Math.max(updatedAt - createdAt, 0);
            }, 0) /
            completedTasks.length /
            (1000 * 60 * 60)
          ).toFixed(2)
        )
      : 0;

    const deptUsers = await User.find({
      organization: orgId,
      department: deptId,
      status: USER_STATUS.ACTIVE,
      isDeleted: false,
    }).select("_id");
    const deptUserIds = deptUsers.map((entry) => entry._id);

    const [deptTotal, deptCompleted] = await Promise.all([
      Task.countDocuments({
        organization: orgId,
        department: deptId,
        assignees: { $in: deptUserIds },
        createdAt: { $gte: rangeStart },
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: orgId,
        department: deptId,
        assignees: { $in: deptUserIds },
        createdAt: { $gte: rangeStart },
        status: TASK_STATUS.COMPLETED,
        isDeleted: false,
      }),
    ]);

    const deptCompletionRate = deptTotal
      ? Number(((deptCompleted / deptTotal) * 100).toFixed(2))
      : 0;

    const series = [];
    const sliceCount = 4;
    const now = Date.now();
    const startMs = rangeStart.getTime();
    const span = Math.max(now - startMs, 1);
    const bucketSize = Math.max(Math.floor(span / sliceCount), 1);

    for (let index = 0; index < sliceCount; index += 1) {
      const bucketStart = new Date(startMs + bucketSize * index);
      const bucketEnd =
        index === sliceCount - 1
          ? new Date(now)
          : new Date(startMs + bucketSize * (index + 1) - 1);

      const completedCount = await Task.countDocuments({
        organization: orgId,
        department: deptId,
        assignees: user._id,
        status: TASK_STATUS.COMPLETED,
        createdAt: {
          $gte: bucketStart,
          $lte: bucketEnd,
        },
        isDeleted: false,
      });

      series.push({
        label: `P${index + 1}`,
        from: bucketStart.toISOString(),
        to: bucketEnd.toISOString(),
        completed: completedCount,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        range,
        completionRate,
        avgTaskTimeHours,
        throughput: assignedCompleted,
        comparisonToDeptAvg: Number(
          (completionRate - deptCompletionRate).toFixed(2)
        ),
        series,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:userId
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const userId = req.validated.params.userId;
    const { populated, previousStatus } = await withMongoTransaction(
      async (session) => {
        const target = await User.findById(userId)
          .withDeleted()
          .session(session);
        if (!target) {
          throw new NotFoundError("User not found");
        }

        enforceReadScope(req.user, target);
        const previousStatus = target.status;

        const immutableAttempt = USER_IMMUTABLE_FIELDS.filter((field) =>
          Object.prototype.hasOwnProperty.call(body, field)
        );
        if (
          immutableAttempt.length &&
          [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.USER].includes(
            target.role
          )
        ) {
          throw new ConflictError(
            `Immutable field update is not allowed for target role ${
              target.role
            }: ${immutableAttempt.join(", ")}`
          );
        }

        if (body.email) {
          const email = normalizeEmail(body.email);
          const existing = await User.findOne({
            organization: target.organization,
            email,
            _id: { $ne: target._id },
          })
            .withDeleted()
            .session(session);
          if (existing) {
            throw new ConflictError("User email already exists");
          }
          target.email = email;
        }

        if (body.departmentId) {
          const department = await Department.findById(body.departmentId)
            .withDeleted()
            .session(session);
          if (!department || department.isDeleted) {
            throw new NotFoundError("Department not found");
          }

          if (
            normalizeId(department.organization) !==
            normalizeId(target.organization)
          ) {
            throw new ValidationError(
              "departmentId must belong to the same organization"
            );
          }

          target.department = department._id;
        }

        if (body.firstName !== undefined) target.firstName = body.firstName;
        if (body.lastName !== undefined) target.lastName = body.lastName;
        if (body.position !== undefined) target.position = body.position;
        if (body.phone !== undefined) target.phone = body.phone;
        if (body.status !== undefined) target.status = body.status;
        if (body.skills !== undefined) {
          target.skills = Array.isArray(body.skills) ? body.skills : [];
        }
        if (body.profilePicture !== undefined)
          target.profilePicture = body.profilePicture;

        if (target.role === USER_ROLES.SUPER_ADMIN && body.role !== undefined) {
          target.role = body.role;
        }

        await target.save({ session });

        await createLifecycleNotification({
          userId: target._id,
          organizationId: target.organization,
          departmentId: target.department,
          title: "Profile updated",
          message: "Your user profile has been updated.",
          entity: target._id,
          session,
        });

        if (body.status !== undefined && previousStatus !== target.status) {
          await createLifecycleNotification({
            userId: target._id,
            organizationId: target.organization,
            departmentId: target.department,
            title: "Account status updated",
            message: `Your account status is now ${target.status}.`,
            entity: target._id,
            session,
          });
        }

        const populated = await User.findById(target._id)
          .withDeleted()
          .populate("department", "name status")
          .populate("organization", "name")
          .session(session);

        return {
          populated,
          previousStatus,
        };
      }
    );

    emitToUser({
      userId: normalizeId(populated._id),
      event: "user:updated",
      payload: { user: toUserSummary(populated) },
    });
    if (body.status !== undefined && previousStatus !== populated.status) {
      emitToUser({
        userId: normalizeId(populated._id),
        event: "user:status",
        payload: { user: toUserSummary(populated), previousStatus },
      });
    }
    emitToDepartment({
      departmentId: normalizeId(
        populated.department?._id || populated.department
      ),
      event: "user:updated",
      payload: { user: toUserSummary(populated) },
    });
    emitToOrganization({
      organizationId: normalizeId(
        populated.organization?._id || populated.organization
      ),
      event: "user:updated",
      payload: { user: toUserSummary(populated) },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User updated",
      data: {
        user: toUserSummary(populated),
      },
    });
  } catch (error) {
    next(mapDuplicateKeyError(error) || error);
  }
});

/**
 * PUT /api/users/:userId/preferences
 */
export const updateUserPreferences = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const userId = req.validated.params.userId;
    if (normalizeId(req.user.id) !== normalizeId(userId)) {
      throw new UnauthorizedError("You can only update your own preferences");
    }

    const preferences = await withMongoTransaction(async (session) => {
      const user = await User.findById(userId).withDeleted().session(session);
      if (!user || user.isDeleted) {
        throw new NotFoundError("User not found");
      }

      const nextPreferences = body.preferences || {};
      user.preferences = {
        ...(user.preferences?.toObject?.() || user.preferences || {}),
        ...nextPreferences,
        notifications: {
          ...(user.preferences?.notifications || {}),
          ...(nextPreferences.notifications || {}),
        },
        appearance: {
          ...(user.preferences?.appearance || {}),
          ...(nextPreferences.appearance || {}),
        },
      };

      await user.save({ session });
      return user.preferences;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Preferences updated",
      data: {
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:userId/security
 */
export const updateUserSecurity = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const userId = req.validated.params.userId;
    if (normalizeId(req.user.id) !== normalizeId(userId)) {
      throw new UnauthorizedError(
        "You can only update your own security settings"
      );
    }

    const security = await withMongoTransaction(async (session) => {
      const user = await User.findById(userId).withDeleted().session(session);
      if (!user || user.isDeleted) {
        throw new NotFoundError("User not found");
      }

      user.security = {
        ...(user.security?.toObject?.() || user.security || {}),
        ...(body.security || {}),
      };

      await user.save({ session });
      return user.security;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Security settings updated",
      data: {
        security,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:userId
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.validated.params.userId;
    const result = await withMongoTransaction(async (session) => {
      const target = await User.findById(userId).withDeleted().session(session);
      if (!target) {
        throw new NotFoundError("User not found");
      }

      enforceReadScope(req.user, target);

      if (target.isDeleted) {
        return {
          alreadyDeleted: true,
          organizationId: normalizeId(target.organization),
          departmentId: normalizeId(target.department),
          userId: normalizeId(target._id),
        };
      }

      await target.softDelete(req.user.id, session);

      const actorId = req.user.id;
      const deletedAt = new Date();
      const targetId = target._id;
      const organizationId = target.organization;

      await Promise.all([
        Task.updateMany(
          {
            createdBy: targetId,
            organization: organizationId,
            isDeleted: false,
          },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        TaskActivity.updateMany(
          {
            createdBy: targetId,
            organization: organizationId,
            isDeleted: false,
          },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        TaskComment.updateMany(
          {
            createdBy: targetId,
            organization: organizationId,
            isDeleted: false,
          },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Attachment.updateMany(
          {
            uploadedBy: targetId,
            organization: organizationId,
            isDeleted: false,
          },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Notification.updateMany(
          { user: targetId, organization: organizationId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Task.updateMany(
          { watchers: targetId },
          { $pull: { watchers: targetId } },
          { session }
        ),
        Task.updateMany(
          { assignees: targetId },
          { $pull: { assignees: targetId } },
          { session }
        ),
        TaskComment.updateMany(
          { mentions: targetId },
          { $pull: { mentions: targetId } },
          { session }
        ),
      ]);

      return {
        alreadyDeleted: false,
        organizationId: normalizeId(target.organization),
        departmentId: normalizeId(target.department),
        userId: normalizeId(target._id),
      };
    });

    if (result.alreadyDeleted) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "User already deleted",
      });
      return;
    }

    emitToOrganization({
      organizationId: result.organizationId,
      event: "user:deleted",
      payload: { userId: result.userId },
    });
    emitToDepartment({
      departmentId: result.departmentId,
      event: "user:deleted",
      payload: { userId: result.userId },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/:userId/restore
 */
export const restoreUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.validated.params.userId;
    const result = await withMongoTransaction(async (session) => {
      const target = await User.findById(userId).withDeleted().session(session);
      if (!target) {
        throw new NotFoundError("User not found");
      }

      enforceReadScope(req.user, target);

      if (!target.isDeleted) {
        return {
          alreadyActive: true,
          user: toUserSummary(target),
          organizationId: normalizeId(target.organization),
          departmentId: normalizeId(target.department),
        };
      }

      await target.restore(session);

      await Promise.all([
        Task.updateMany(
          {
            createdBy: target._id,
            organization: target.organization,
            isDeleted: true,
          },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        TaskActivity.updateMany(
          {
            createdBy: target._id,
            organization: target.organization,
            isDeleted: true,
          },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        TaskComment.updateMany(
          {
            createdBy: target._id,
            organization: target.organization,
            isDeleted: true,
          },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        Attachment.updateMany(
          {
            uploadedBy: target._id,
            organization: target.organization,
            isDeleted: true,
          },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        Notification.updateMany(
          {
            user: target._id,
            organization: target.organization,
            isDeleted: true,
          },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
      ]);

      const restored = await User.findById(target._id)
        .withDeleted()
        .populate("department", "name status")
        .populate("organization", "name")
        .session(session);

      return {
        alreadyActive: false,
        user: toUserSummary(restored),
        organizationId: normalizeId(target.organization),
        departmentId: normalizeId(target.department),
      };
    });

    if (result.alreadyActive) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "User is already active",
        data: {
          user: result.user,
        },
      });
      return;
    }

    emitToOrganization({
      organizationId: result.organizationId,
      event: "user:restored",
      payload: { user: result.user },
    });
    emitToDepartment({
      departmentId: result.departmentId,
      event: "user:restored",
      payload: { user: result.user },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User restored",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default {
  listUsers,
  createUser,
  getUser,
  getUserActivity,
  getUserPerformance,
  updateUser,
  updateUserPreferences,
  updateUserSecurity,
  deleteUser,
  restoreUser,
};
