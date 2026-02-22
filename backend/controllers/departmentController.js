/**
 * @file Department controllers (Phase 3).
 */
import asyncHandler from "express-async-handler";
import {
  Attachment,
  Department,
  Material,
  Notification,
  Task,
  TaskActivity,
  TaskComment,
  User,
} from "../models/index.js";
import {
  DEPARTMENT_STATUS,
  HTTP_STATUS,
  TASK_STATUS,
  USER_ROLES,
} from "../utils/constants.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.js";
import { parsePagination, withMongoTransaction } from "../utils/helpers.js";
import { createNotificationSafe } from "../services/notificationService.js";
import {
  emitToDepartment,
  emitToOrganization,
} from "../services/socketService.js";

const parseCsv = (value) =>
  value === undefined || value === null || value === ""
    ? []
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const normalizeId = (value) =>
  !value
    ? null
    : typeof value === "object" && typeof value.toString === "function"
    ? value.toString()
    : String(value);

const isPlatformSuperAdmin = (user) =>
  user?.role === USER_ROLES.SUPER_ADMIN && Boolean(user?.isPlatformOrgUser);

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

const enforceReadScope = (reqUser, department) => {
  if (isPlatformSuperAdmin(reqUser)) {
    return;
  }

  const reqOrgId = normalizeId(reqUser.organization);
  const deptOrgId = normalizeId(
    department.organization?._id || department.organization
  );

  if (reqOrgId !== deptOrgId) {
    throw new UnauthorizedError("Cross-organization access is not allowed");
  }

  if (
    [USER_ROLES.MANAGER, USER_ROLES.USER].includes(reqUser.role) &&
    normalizeId(reqUser.department) !== normalizeId(department._id)
  ) {
    throw new UnauthorizedError("Cross-department access is not allowed");
  }
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

const enrichDepartment = async (department) => {
  const orgId = department.organization?._id || department.organization;
  const deptId = department._id;

  const [memberCount, taskCount, activeTaskCount] = await Promise.all([
    User.countDocuments({
      organization: orgId,
      department: deptId,
      isDeleted: false,
    }),
    Task.countDocuments({
      organization: orgId,
      department: deptId,
      isDeleted: false,
    }),
    Task.countDocuments({
      organization: orgId,
      department: deptId,
      status: { $ne: TASK_STATUS.COMPLETED },
      isDeleted: false,
    }),
  ]);

  return {
    id: normalizeId(department._id),
    name: department.name,
    description: department.description || "",
    status: department.status,
    manager: department.manager
      ? {
          id: normalizeId(department.manager._id || department.manager),
          firstName: department.manager.firstName || "",
          lastName: department.manager.lastName || "",
          fullName: `${department.manager.firstName || ""} ${
            department.manager.lastName || ""
          }`.trim(),
          email: department.manager.email || "",
        }
      : null,
    organization: {
      id: normalizeId(orgId),
      name: department.organization?.name || "",
    },
    createdBy: normalizeId(department.createdBy),
    createdAt: department.createdAt || null,
    updatedAt: department.updatedAt || null,
    isDeleted: Boolean(department.isDeleted),
    memberCount,
    taskCount,
    activeTaskCount,
  };
};

const createDepartmentNotification = async ({
  userId,
  organizationId,
  departmentId,
  title,
  message,
  entity = null,
  session = null,
}) => {
  await createNotificationSafe({
    title,
    message,
    user: userId,
    organization: organizationId,
    department: departmentId,
    entityModel: "Department",
    entity,
    session,
  });
};

const notifyDepartmentManager = async ({
  managerId,
  organizationId,
  departmentId,
  title,
  message,
  entity = null,
  session = null,
}) => {
  if (!managerId) {
    return;
  }

  await createDepartmentNotification({
    userId: managerId,
    organizationId,
    departmentId,
    title,
    message,
    entity,
    session,
  });
};

const loadManager = async ({ managerId, organizationId, session = null }) => {
  if (!managerId) {
    return null;
  }

  const manager = await User.findById(managerId).withDeleted().session(session);
  if (!manager || manager.isDeleted) {
    throw new NotFoundError("Manager user not found");
  }

  if (
    normalizeId(manager.organization?._id || manager.organization) !==
    normalizeId(organizationId)
  ) {
    throw new ValidationError("managerId must belong to the same organization");
  }

  if (
    ![USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(
      manager.role
    )
  ) {
    throw new ValidationError(
      "Manager must have SuperAdmin, Admin, or Manager role"
    );
  }

  if (!manager.isHod) {
    throw new ValidationError("Manager must be marked as HOD");
  }

  return manager;
};

/**
 * GET /api/departments
 */
export const listDepartments = asyncHandler(async (req, res, next) => {
  try {
    const query = req.validated?.query || {};
    const pagination = parsePagination(query);
    const organizationId = ensureOrgScopeQuery(req.user, query.organizationId);

    const filter = {
      organization: organizationId,
    };

    const statusFilter = parseCsv(query.status);
    if (statusFilter.length) {
      filter.status = { $in: statusFilter };
    }

    const departmentIds = parseCsv(query.departmentId);
    if (departmentIds.length) {
      filter._id = { $in: departmentIds };
    }

    if (query.managerId) {
      filter.manager = query.managerId;
    }

    if ([USER_ROLES.MANAGER, USER_ROLES.USER].includes(req.user.role)) {
      filter._id = req.user.department;
    }

    const createdAtRange = buildDateRangeFilter(
      query.createdFrom,
      query.createdTo
    );
    if (createdAtRange) {
      filter.createdAt = createdAtRange;
    }

    const minMemberCount =
      query.memberCountMin === undefined
        ? null
        : Number.parseInt(query.memberCountMin, 10);
    const maxMemberCount =
      query.memberCountMax === undefined
        ? null
        : Number.parseInt(query.memberCountMax, 10);
    const requiresMemberFiltering =
      minMemberCount !== null || maxMemberCount !== null;

    if (requiresMemberFiltering) {
      const baseQuery = pagination.includeDeleted
        ? Department.find(filter).withDeleted()
        : Department.find(filter);

      const departments = await baseQuery
        .populate("manager", "firstName lastName email")
        .populate("organization", "name")
        .sort(pagination.sort)
        .exec();

      const enriched = await Promise.all(
        departments.map((item) => enrichDepartment(item))
      );
      const filtered = enriched.filter((item) => {
        if (minMemberCount !== null && item.memberCount < minMemberCount) {
          return false;
        }
        if (maxMemberCount !== null && item.memberCount > maxMemberCount) {
          return false;
        }
        return true;
      });

      const totalDocs = filtered.length;
      const docs = filtered.slice(
        pagination.skip,
        pagination.skip + pagination.limit
      );
      const totalPages = Math.max(Math.ceil(totalDocs / pagination.limit), 1);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          departments: docs,
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
      return;
    }

    const result = await Department.paginate(filter, {
      ...pagination.paginateOptions,
      populate: [
        { path: "manager", select: "firstName lastName email" },
        { path: "organization", select: "name" },
      ],
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    const departments = await Promise.all(
      (result.docs || []).map((item) => enrichDepartment(item))
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        departments,
        pagination: {
          totalDocs: result.totalDocs || 0,
          totalItems: result.totalDocs || 0,
          limit: result.limit || pagination.limit,
          page: result.page || pagination.page,
          totalPages: result.totalPages || 1,
          hasNextPage: Boolean(result.hasNextPage),
          hasPrevPage: Boolean(result.hasPrevPage),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/departments
 */
export const createDepartment = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const organizationId = normalizeId(req.user.organization);
    const { data, departmentId } = await withMongoTransaction(
      async (session) => {
        const existing = await Department.findOne({
          organization: organizationId,
          name: body.name,
        })
          .withDeleted()
          .collation({ locale: "en", strength: 2 })
          .session(session);

        if (existing) {
          throw new ConflictError(
            "Department name already exists in this organization"
          );
        }

        const manager = await loadManager({
          managerId: body.managerId,
          organizationId,
          session,
        });

        const [department] = await Department.create(
          [
            {
              name: body.name,
              description: body.description,
              status: body.status || DEPARTMENT_STATUS.ACTIVE,
              manager: manager?._id || null,
              organization: organizationId,
              createdBy: req.user.id,
            },
          ],
          { session }
        );

        if (manager) {
          await createDepartmentNotification({
            userId: manager._id,
            organizationId,
            departmentId: department._id,
            title: "Department assignment",
            message: `You were assigned as manager for ${department.name}.`,
            entity: department._id,
            session,
          });
        }

        const populated = await Department.findById(department._id)
          .withDeleted()
          .populate("manager", "firstName lastName email")
          .populate("organization", "name")
          .session(session);

        return {
          departmentId: normalizeId(department._id),
          data: await enrichDepartment(populated),
        };
      }
    );

    emitToOrganization({
      organizationId,
      event: "department:created",
      payload: { department: data },
    });
    emitToDepartment({
      departmentId,
      event: "department:created",
      payload: { department: data },
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Department created",
      data: {
        department: data,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/departments/:departmentId
 */
export const getDepartment = asyncHandler(async (req, res, next) => {
  try {
    const departmentId = req.validated.params.departmentId;
    const department = await Department.findById(departmentId)
      .withDeleted()
      .populate("manager", "firstName lastName email")
      .populate("organization", "name");

    if (!department) {
      throw new NotFoundError("Department not found");
    }

    enforceReadScope(req.user, department);

    const [
      departmentData,
      totalUsers,
      totalTasks,
      completedTasks,
      overdueTasks,
      materialCount,
    ] = await Promise.all([
      enrichDepartment(department),
      User.countDocuments({
        organization: department.organization?._id || department.organization,
        department: department._id,
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: department.organization?._id || department.organization,
        department: department._id,
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: department.organization?._id || department.organization,
        department: department._id,
        status: TASK_STATUS.COMPLETED,
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: department.organization?._id || department.organization,
        department: department._id,
        status: { $ne: TASK_STATUS.COMPLETED },
        dueDate: { $lt: new Date() },
        isDeleted: false,
      }),
      Material.countDocuments({
        organization: department.organization?._id || department.organization,
        department: department._id,
        isDeleted: false,
      }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        department: departmentData,
        aggregates: {
          totalUsers,
          totalTasks,
          completedTasks,
          activeTasks: Math.max(totalTasks - completedTasks, 0),
          overdueTasks,
          materialCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/departments/:departmentId/dashboard
 */
export const getDepartmentDashboard = asyncHandler(async (req, res, next) => {
  try {
    const departmentId = req.validated.params.departmentId;
    const department = await Department.findById(departmentId).withDeleted();
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    enforceReadScope(req.user, department);

    const orgId = department.organization;
    const deptId = department._id;
    const now = Date.now();
    const sevenDays = new Date(now + 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTasks,
      completedTasks,
      overdueTask,
      upcomingDeadlines,
      byStatus,
      byPriority,
    ] = await Promise.all([
      User.countDocuments({
        organization: orgId,
        department: deptId,
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: orgId,
        department: deptId,
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: orgId,
        department: deptId,
        status: TASK_STATUS.COMPLETED,
        isDeleted: false,
      }),
      Task.countDocuments({
        organization: orgId,
        department: deptId,
        status: { $ne: TASK_STATUS.COMPLETED },
        dueDate: { $lt: new Date() },
        isDeleted: false,
      }),
      Task.find({
        organization: orgId,
        department: deptId,
        status: { $ne: TASK_STATUS.COMPLETED },
        dueDate: { $gte: new Date(), $lte: sevenDays },
        isDeleted: false,
      })
        .sort({ dueDate: 1 })
        .limit(10)
        .select("title dueDate priority status type"),
      Task.aggregate([
        {
          $match: { organization: orgId, department: deptId, isDeleted: false },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]).option({ withDeleted: true }),
      Task.aggregate([
        {
          $match: { organization: orgId, department: deptId, isDeleted: false },
        },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $project: { _id: 0, priority: "$_id", count: 1 } },
      ]).option({ withDeleted: true }),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        activeTasks: Math.max(totalTasks - completedTasks, 0),
        completedTasks,
        overdueTask,
        overdueTasks: overdueTask,
        byStatus,
        byPriority,
        upcomingDeadlines: upcomingDeadlines.map((task) => ({
          id: normalizeId(task._id),
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          type: task.type,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/departments/:departmentId/activity
 */
export const getDepartmentActivity = asyncHandler(async (req, res, next) => {
  try {
    const departmentId = req.validated.params.departmentId;
    const query = req.validated.query;
    const pagination = parsePagination(query);
    const requestedEntityModel = String(query.entityModel || "").trim();

    const department = await Department.findById(departmentId).withDeleted();
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    enforceReadScope(req.user, department);

    const createdAtRange = buildDateRangeFilter(query.from, query.to);
    const base = createdAtRange ? { createdAt: createdAtRange } : {};
    const orgId = department.organization;
    const deptId = department._id;

    const [tasks, activities, comments, files] = await Promise.all([
      Task.find({
        organization: orgId,
        department: deptId,
        isDeleted: false,
        ...base,
      })
        .sort({ createdAt: -1 })
        .limit(120)
        .select("title type status createdAt"),
      TaskActivity.find({
        organization: orgId,
        department: deptId,
        isDeleted: false,
        ...base,
      })
        .sort({ createdAt: -1 })
        .limit(120)
        .select("activity parent parentModel createdAt"),
      TaskComment.find({
        organization: orgId,
        department: deptId,
        isDeleted: false,
        ...base,
      })
        .sort({ createdAt: -1 })
        .limit(120)
        .select("comment parent parentModel createdAt"),
      Attachment.find({
        organization: orgId,
        department: deptId,
        isDeleted: false,
        ...base,
      })
        .sort({ createdAt: -1 })
        .limit(120)
        .select("filename parent parentModel createdAt"),
    ]);

    const stream = [
      ...tasks.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "Task",
        entityId: normalizeId(item._id),
        title: "Task",
        description: item.title,
        meta: `${item.type} | ${item.status}`,
        createdAt: item.createdAt,
      })),
      ...activities.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "TaskActivity",
        entityId: normalizeId(item._id),
        title: "Activity",
        description: item.activity,
        meta: item.parentModel,
        createdAt: item.createdAt,
      })),
      ...comments.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "TaskComment",
        entityId: normalizeId(item._id),
        title: "Comment",
        description: item.comment,
        meta: item.parentModel,
        createdAt: item.createdAt,
      })),
      ...files.map((item) => ({
        id: normalizeId(item._id),
        entityModel: "Attachment",
        entityId: normalizeId(item._id),
        title: "File",
        description: item.filename,
        meta: item.parentModel,
        createdAt: item.createdAt,
      })),
    ];

    const filtered = requestedEntityModel
      ? stream.filter((item) => item.entityModel === requestedEntityModel)
      : stream;
    const sorted = filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const totalDocs = sorted.length;
    const entries = sorted.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    );
    const totalPages = Math.max(Math.ceil(totalDocs / pagination.limit), 1);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        activities: entries,
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
 * PUT /api/departments/:departmentId
 */
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const departmentId = req.validated.params.departmentId;
    const { data, organizationId } = await withMongoTransaction(
      async (session) => {
        const department = await Department.findById(departmentId)
          .withDeleted()
          .session(session);
        if (!department) {
          throw new NotFoundError("Department not found");
        }

        enforceReadScope(req.user, department);
        const previousManagerId = normalizeId(department.manager);
        const previousStatus = department.status;

        if (body.name && body.name !== department.name) {
          const duplicate = await Department.findOne({
            organization: department.organization,
            name: body.name,
            _id: { $ne: department._id },
          })
            .withDeleted()
            .collation({ locale: "en", strength: 2 })
            .session(session);

          if (duplicate) {
            throw new ConflictError(
              "Department name already exists in this organization"
            );
          }
        }

        const manager = await loadManager({
          managerId: body.managerId,
          organizationId: department.organization,
          session,
        });

        if (body.name !== undefined) department.name = body.name;
        if (body.description !== undefined)
          department.description = body.description;
        if (body.status !== undefined) department.status = body.status;
        if (body.managerId !== undefined)
          department.manager = manager?._id || null;

        await department.save({ session });

        const populated = await Department.findById(department._id)
          .withDeleted()
          .populate("manager", "firstName lastName email")
          .populate("organization", "name")
          .session(session);

        const data = await enrichDepartment(populated);
        const currentManagerId = normalizeId(department.manager);

        if (previousManagerId !== currentManagerId) {
          await Promise.all([
            notifyDepartmentManager({
              managerId: previousManagerId,
              organizationId: normalizeId(department.organization),
              departmentId: normalizeId(department._id),
              title: "Department manager reassigned",
              message: `You are no longer assigned as manager for ${department.name}.`,
              entity: department._id,
              session,
            }),
            notifyDepartmentManager({
              managerId: currentManagerId,
              organizationId: normalizeId(department.organization),
              departmentId: normalizeId(department._id),
              title: "Department assignment",
              message: `You were assigned as manager for ${department.name}.`,
              entity: department._id,
              session,
            }),
          ]);
        }

        if (body.status !== undefined && previousStatus !== department.status) {
          await notifyDepartmentManager({
            managerId: currentManagerId,
            organizationId: normalizeId(department.organization),
            departmentId: normalizeId(department._id),
            title: "Department status updated",
            message: `${department.name} status changed to ${department.status}.`,
            entity: department._id,
            session,
          });
        }

        return {
          data,
          organizationId: normalizeId(department.organization),
          departmentId: normalizeId(department._id),
        };
      }
    );

    emitToOrganization({
      organizationId,
      event: "department:updated",
      payload: { department: data },
    });
    emitToDepartment({
      departmentId: normalizeId(data.id),
      event: "department:updated",
      payload: { department: data },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Department updated",
      data: {
        department: data,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/departments/:departmentId
 */
export const deleteDepartment = asyncHandler(async (req, res, next) => {
  try {
    const departmentId = req.validated.params.departmentId;
    const result = await withMongoTransaction(async (session) => {
      const department = await Department.findById(departmentId)
        .withDeleted()
        .session(session);
      if (!department) {
        throw new NotFoundError("Department not found");
      }

      enforceReadScope(req.user, department);

      if (department.isDeleted) {
        return {
          alreadyDeleted: true,
          orgId: normalizeId(department.organization),
          deptId: normalizeId(department._id),
        };
      }

      await department.softDelete(req.user.id, session);
      const orgId = department.organization;
      const deptId = department._id;
      const deletedAt = new Date();
      const actorId = req.user.id;

      await Promise.all([
        User.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Task.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        TaskActivity.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        TaskComment.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Attachment.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Material.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
        Notification.updateMany(
          { organization: orgId, department: deptId, isDeleted: false },
          { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
          { session }
        ),
      ]);

      await notifyDepartmentManager({
        managerId: normalizeId(department.manager),
        organizationId: normalizeId(orgId),
        departmentId: normalizeId(deptId),
        title: "Department deleted",
        message: `${department.name} was deleted and department-scoped records were archived.`,
        entity: department._id,
        session,
      });

      return {
        alreadyDeleted: false,
        orgId: normalizeId(orgId),
        deptId: normalizeId(deptId),
      };
    });

    if (result.alreadyDeleted) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Department already deleted",
      });
      return;
    }

    emitToOrganization({
      organizationId: result.orgId,
      event: "department:deleted",
      payload: { departmentId: result.deptId },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Department deleted",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/departments/:departmentId/restore
 */
export const restoreDepartment = asyncHandler(async (req, res, next) => {
  try {
    const departmentId = req.validated.params.departmentId;
    const result = await withMongoTransaction(async (session) => {
      const department = await Department.findById(departmentId)
        .withDeleted()
        .session(session);
      if (!department) {
        throw new NotFoundError("Department not found");
      }

      enforceReadScope(req.user, department);

      if (!department.isDeleted) {
        return {
          alreadyActive: true,
          data: await enrichDepartment(department),
          orgId: normalizeId(department.organization),
          deptId: normalizeId(department._id),
        };
      }

      await department.restore(session);
      const orgId = department.organization;
      const deptId = department._id;

      await Promise.all([
        User.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        Task.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        TaskActivity.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        TaskComment.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        Attachment.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        Material.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
        Notification.updateMany(
          { organization: orgId, department: deptId, isDeleted: true },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
          { session }
        ),
      ]);

      const populated = await Department.findById(department._id)
        .withDeleted()
        .populate("manager", "firstName lastName email")
        .populate("organization", "name")
        .session(session);
      const data = await enrichDepartment(populated);

      await notifyDepartmentManager({
        managerId: normalizeId(department.manager),
        organizationId: normalizeId(orgId),
        departmentId: normalizeId(deptId),
        title: "Department restored",
        message: `${department.name} was restored and department-scoped records were reactivated.`,
        entity: department._id,
        session,
      });

      return {
        alreadyActive: false,
        data,
        orgId: normalizeId(orgId),
        deptId: normalizeId(deptId),
      };
    });

    if (result.alreadyActive) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Department is already active",
        data: {
          department: result.data,
        },
      });
      return;
    }

    emitToOrganization({
      organizationId: result.orgId,
      event: "department:restored",
      payload: { department: result.data },
    });
    emitToDepartment({
      departmentId: result.deptId,
      event: "department:restored",
      payload: { department: result.data },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Department restored",
      data: {
        department: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default {
  listDepartments,
  createDepartment,
  getDepartment,
  getDepartmentActivity,
  getDepartmentDashboard,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
};
