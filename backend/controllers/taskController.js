/**
 * @file Task controllers (Phase 4).
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
  Vendor,
} from "../models/index.js";
import {
  DEPARTMENT_STATUS,
  HTTP_STATUS,
  SOCKET_EVENTS,
  TASK_STATUS,
  TASK_TYPE,
  USER_ROLES,
  USER_STATUS,
  VENDOR_STATUS,
} from "../utils/constants.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import {
  normalizeEmailLocalPart,
  normalizeId,
  parsePagination,
  withMongoTransaction,
} from "../utils/helpers.js";
import {
  buildDateRangeFilter,
  buildPaginationMeta,
  computeMaterialQuantityDeltas,
  ensureOrgScopeQuery,
  extractMentionTokens,
  isPlatformSuperAdmin,
  normalizeTags,
  parseCsv,
} from "../utils/taskHelpers.js";
import { createNotificationSafe } from "../services/notificationService.js";
import { applyMaterialInventoryDeltas } from "../services/taskInventoryService.js";
import {
  emitToDepartment,
  emitToOrganization,
  emitToTask,
  emitToUser,
} from "../services/socketService.js";

const toUserSummary = (user) => {
  const profilePicture = user?.profilePicture || {};

  return {
    id: normalizeId(user?._id),
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    profilePictureUrl: profilePicture.url || user?.profilePictureUrl || "",
  };
};

const toDepartmentSummary = (department) => ({
  id: normalizeId(department?._id),
  name: department?.name || "",
});

const toVendorSummary = (vendor) => ({
  id: normalizeId(vendor?._id),
  name: vendor?.name || "",
  status: vendor?.status || "",
});

const toTaskSummary = ({
  task,
  activitiesCount = 0,
  commentsCount = 0,
  attachmentsCount = 0,
}) => {
  const createdBy = task?.createdBy || {};
  const department = task?.department || {};

  const summary = {
    id: normalizeId(task?._id),
    type: task?.type || "",
    title: task?.title || "",
    status: task?.status || TASK_STATUS.TODO,
    priority: task?.priority || "",
    tags: Array.isArray(task?.tags) ? task.tags : [],
    department: toDepartmentSummary(department),
    createdBy: toUserSummary(createdBy),
    activitiesCount,
    commentsCount,
    attachmentsCount,
    isDeleted: Boolean(task?.isDeleted),
    createdAt: task?.createdAt || null,
    updatedAt: task?.updatedAt || null,
  };

  if (task?.type === TASK_TYPE.PROJECT) {
    summary.vendor = toVendorSummary(task?.vendor);
    summary.startDate = task?.startDate || null;
    summary.dueDate = task?.dueDate || null;
  }

  if (task?.type === TASK_TYPE.ASSIGNED) {
    summary.assignees = Array.isArray(task?.assignees)
      ? task.assignees.map((user) => toUserSummary(user))
      : [];
    summary.startDate = task?.startDate || null;
    summary.dueDate = task?.dueDate || null;
  }

  if (task?.type === TASK_TYPE.ROUTINE) {
    summary.date = task?.date || null;
  }

  return summary;
};

const loadDepartmentForTaskWrite = async ({
  organizationId,
  departmentId,
  session,
}) => {
  const department = await Department.findById(departmentId)
    .withDeleted()
    .session(session);
  if (!department || department.isDeleted) {
    throw new NotFoundError("Department not found");
  }

  if (
    normalizeId(department.organization?._id || department.organization) !==
    normalizeId(organizationId)
  ) {
    throw new ValidationError(
      "Department must belong to the active organization scope"
    );
  }

  if (department.status !== DEPARTMENT_STATUS.ACTIVE) {
    throw new ConflictError("Department is inactive");
  }

  return department;
};

const loadActiveScopedUsers = async ({
  userIds = [],
  organizationId,
  departmentId,
  session,
  label = "userIds",
}) => {
  const uniqueIds = Array.from(
    new Set(
      (Array.isArray(userIds) ? userIds : [])
        .map((id) => normalizeId(id))
        .filter(Boolean)
    )
  );

  if (uniqueIds.length === 0) {
    return [];
  }

  const users = await User.find({
    _id: { $in: uniqueIds },
    organization: organizationId,
    department: departmentId,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    isDeleted: false,
  })
    .select("firstName lastName profilePicture email")
    .session(session);

  if (users.length !== uniqueIds.length) {
    throw new ValidationError(`${label} contains invalid or inactive users`);
  }

  return users;
};

const resolveMentionUsers = async ({
  tokens = [],
  organizationId,
  departmentId,
  session,
}) => {
  const normalized = Array.from(
    new Set(
      (Array.isArray(tokens) ? tokens : [])
        .map((token) => normalizeEmailLocalPart(token))
        .filter(Boolean)
    )
  ).slice(0, 20);

  if (normalized.length === 0) {
    return [];
  }

  const candidates = await User.find({
    organization: organizationId,
    department: departmentId,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    isDeleted: false,
  })
    .select("firstName lastName profilePicture email")
    .session(session);

  const byLocalPart = new Map();
  candidates.forEach((candidate) => {
    const email = String(candidate.email || "")
      .trim()
      .toLowerCase();
    const localPart = email.includes("@") ? email.split("@")[0] : email;
    const normalizedLocalPart = normalizeEmailLocalPart(localPart);
    if (!normalizedLocalPart) {
      return;
    }

    const existing = byLocalPart.get(normalizedLocalPart) || [];
    byLocalPart.set(normalizedLocalPart, [...existing, candidate]);
  });

  const resolved = [];
  normalized.forEach((token) => {
    const matches = byLocalPart.get(token) || [];
    if (matches.length === 1) {
      resolved.push(matches[0]);
    }
  });

  return resolved.slice(0, 20);
};

const createNotificationsForUsers = async ({
  recipients = [],
  title,
  message,
  organizationId,
  departmentId,
  entityModel = "Task",
  entity = null,
  session,
}) => {
  const uniqueRecipientIds = Array.from(
    new Set(
      (Array.isArray(recipients) ? recipients : [])
        .map((id) => normalizeId(id))
        .filter(Boolean)
    )
  );

  await Promise.all(
    uniqueRecipientIds.map((userId) =>
      createNotificationSafe({
        title,
        message,
        user: userId,
        organization: organizationId,
        department: departmentId,
        entityModel,
        entity,
        session,
      })
    )
  );

  return uniqueRecipientIds;
};

const emitNotificationEvents = (userIds = [], payload = {}) => {
  (Array.isArray(userIds) ? userIds : []).forEach((userId) => {
    emitToUser({
      userId,
      event: SOCKET_EVENTS.NOTIFICATION_CREATED,
      payload,
    });
  });
};

const resolveTaskIdForAttachmentParent = async ({
  parentModel,
  parentId,
  session,
}) => {
  if (parentModel === "Task") {
    return normalizeId(parentId);
  }

  if (parentModel === "TaskActivity") {
    const activity = await TaskActivity.findById(parentId)
      .withDeleted()
      .select("parent parentModel")
      .session(session);
    if (!activity) {
      return null;
    }

    if (activity.parentModel === "Task") {
      return normalizeId(activity.parent);
    }

    return null;
  }

  if (parentModel === "TaskComment") {
    let cursor = await TaskComment.findById(parentId)
      .withDeleted()
      .select("parent parentModel")
      .session(session);

    for (let i = 0; i < 6 && cursor; i += 1) {
      if (cursor.parentModel === "Task") {
        return normalizeId(cursor.parent);
      }

      if (cursor.parentModel === "TaskActivity") {
        return resolveTaskIdForAttachmentParent({
          parentModel: "TaskActivity",
          parentId: cursor.parent,
          session,
        });
      }

      if (cursor.parentModel !== "TaskComment") {
        return null;
      }

      cursor = await TaskComment.findById(cursor.parent)
        .withDeleted()
        .select("parent parentModel")
        .session(session);
    }

    return null;
  }

  return null;
};

const loadTaskAttachmentsForFilesTab = async ({ taskId, session }) => {
  const activityIds = (
    await TaskActivity.find({ parentModel: "Task", parent: taskId })
      .withDeleted()
      .select("_id")
      .session(session)
  ).map((doc) => doc._id);

  const rootComments = await TaskComment.find({
    parentModel: "Task",
    parent: taskId,
  })
    .withDeleted()
    .select("_id parent parentModel")
    .session(session);

  const activityComments = activityIds.length
    ? await TaskComment.find({
        parentModel: "TaskActivity",
        parent: { $in: activityIds },
      })
        .withDeleted()
        .select("_id parent parentModel")
        .session(session)
    : [];

  const commentIds = new Set([
    ...rootComments.map((doc) => normalizeId(doc._id)),
    ...activityComments.map((doc) => normalizeId(doc._id)),
  ]);

  let frontier = [...commentIds];
  for (let depth = 0; depth < 6 && frontier.length > 0; depth += 1) {
    const children = await TaskComment.find({
      parentModel: "TaskComment",
      parent: { $in: frontier },
    })
      .withDeleted()
      .select("_id")
      .session(session);

    const next = [];
    children.forEach((child) => {
      const id = normalizeId(child._id);
      if (!id || commentIds.has(id)) {
        return;
      }
      commentIds.add(id);
      next.push(id);
    });

    frontier = next;
  }

  const attachmentFilter = [
    { parentModel: "Task", parent: taskId },
    ...(activityIds.length
      ? [{ parentModel: "TaskActivity", parent: { $in: activityIds } }]
      : []),
    ...(commentIds.size
      ? [
          {
            parentModel: "TaskComment",
            parent: { $in: Array.from(commentIds) },
          },
        ]
      : []),
  ];

  const attachments = await Attachment.find({ $or: attachmentFilter })
    .withDeleted()
    .sort({ createdAt: -1 })
    .limit(250)
    .select(
      "filename fileUrl fileType fileSize parent parentModel uploadedBy createdAt isDeleted"
    )
    .populate("uploadedBy", "firstName lastName profilePicture")
    .session(session);

  return attachments.map((attachment) => ({
    id: normalizeId(attachment._id),
    filename: attachment.filename,
    fileUrl: attachment.fileUrl,
    fileType: attachment.fileType,
    fileSize: attachment.fileSize,
    parent: normalizeId(attachment.parent),
    parentModel: attachment.parentModel,
    uploadedBy: toUserSummary(attachment.uploadedBy),
    createdAt: attachment.createdAt || null,
    isDeleted: Boolean(attachment.isDeleted),
  }));
};

/**
 * GET /api/tasks
 */
export const listTasks = asyncHandler(async (req, res, next) => {
  try {
    const query = req.validated.query;
    const pagination = parsePagination(query);
    const organizationId = ensureOrgScopeQuery(req.user, query.organizationId);

    const filter = {
      organization: organizationId,
    };

    const typeFilter = parseCsv(query.type);
    if (typeFilter.length) {
      filter.type = { $in: typeFilter };
    }

    const statusFilter = parseCsv(query.status);
    if (statusFilter.length) {
      filter.status = { $in: statusFilter };
    }

    const priorityFilter = parseCsv(query.priority);
    if (priorityFilter.length) {
      filter.priority = { $in: priorityFilter };
    }

    const departmentIds = parseCsv(query.departmentId);
    if (isPlatformSuperAdmin(req.user)) {
      if (departmentIds.length) {
        filter.department = { $in: departmentIds };
      }
    } else {
      filter.department = normalizeId(req.user.department);
    }

    if (query.assigneeId) {
      filter.assignees = query.assigneeId;
    }

    if (query.createdById) {
      filter.createdBy = query.createdById;
    }

    if (query.watcherId) {
      filter.watchers = query.watcherId;
    }

    if (query.vendorId) {
      filter.vendor = query.vendorId;
    }

    const startRange = buildDateRangeFilter(query.startFrom, query.startTo);
    if (startRange) {
      filter.startDate = startRange;
    }

    const dueRange = buildDateRangeFilter(query.dueFrom, query.dueTo);
    if (dueRange) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ dueDate: dueRange }, { date: dueRange }],
      });
    }

    const tagTokens = parseCsv(query.tags).map((tag) =>
      String(tag).trim().toLowerCase()
    );
    if (tagTokens.length) {
      filter.tags = { $in: tagTokens };
    }

    if (query.materialId) {
      const activityQuery = TaskActivity.find({
        parentModel: "Task",
        "materials.material": query.materialId,
        organization: organizationId,
      }).select("parent");

      if (pagination.includeDeleted) {
        activityQuery.withDeleted();
      }

      const activityParents = await activityQuery.exec();
      const taskIdsFromActivities = Array.from(
        new Set(
          activityParents.map((doc) => normalizeId(doc.parent)).filter(Boolean)
        )
      );

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { "materials.material": query.materialId },
          ...(taskIdsFromActivities.length
            ? [{ _id: { $in: taskIdsFromActivities } }]
            : []),
        ],
      });
    }

    const paginationResult = await Task.paginate(filter, {
      ...pagination.paginateOptions,
      populate: [
        { path: "department", select: "name" },
        { path: "createdBy", select: "firstName lastName profilePicture" },
        { path: "vendor", select: "name status" },
        { path: "assignees", select: "firstName lastName profilePicture" },
      ],
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    const tasks = paginationResult.docs || [];
    const taskIds = tasks.map((task) => task._id);

    const [activityCounts, commentCounts, attachmentCounts] = await Promise.all(
      [
        TaskActivity.aggregate([
          { $match: { parentModel: "Task", parent: { $in: taskIds } } },
          { $group: { _id: "$parent", count: { $sum: 1 } } },
        ]).option({ withDeleted: pagination.includeDeleted }),
        TaskComment.aggregate([
          { $match: { parentModel: "Task", parent: { $in: taskIds } } },
          { $group: { _id: "$parent", count: { $sum: 1 } } },
        ]).option({ withDeleted: pagination.includeDeleted }),
        Attachment.aggregate([
          { $match: { parentModel: "Task", parent: { $in: taskIds } } },
          { $group: { _id: "$parent", count: { $sum: 1 } } },
        ]).option({ withDeleted: pagination.includeDeleted }),
      ]
    );

    const toCountMap = (rows) =>
      new Map(
        (rows || []).map((row) => [
          normalizeId(row._id),
          Number(row.count || 0),
        ])
      );

    const activityCountMap = toCountMap(activityCounts);
    const commentCountMap = toCountMap(commentCounts);
    const attachmentCountMap = toCountMap(attachmentCounts);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        tasks: tasks.map((task) =>
          toTaskSummary({
            task,
            activitiesCount: activityCountMap.get(normalizeId(task._id)) || 0,
            commentsCount: commentCountMap.get(normalizeId(task._id)) || 0,
            attachmentsCount:
              attachmentCountMap.get(normalizeId(task._id)) || 0,
          })
        ),
        pagination: buildPaginationMeta(paginationResult),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks
 */
export const createTask = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const organizationId = normalizeId(req.user.organization);
    const departmentId = normalizeId(req.user.department);

    const result = await withMongoTransaction(async (session) => {
      await loadDepartmentForTaskWrite({
        organizationId,
        departmentId,
        session,
      });

      const taskType = body.type;
      const tags = normalizeTags(body.tags);
      const watcherIds = Array.from(
        new Set(
          [
            ...(Array.isArray(body.watchers) ? body.watchers : []).map((id) =>
              normalizeId(id)
            ),
            normalizeId(req.user.id),
          ].filter(Boolean)
        )
      );

      const watchers = await loadActiveScopedUsers({
        userIds: watcherIds,
        organizationId,
        departmentId,
        session,
        label: "watchers",
      });

      let vendor = null;
      if (taskType === TASK_TYPE.PROJECT) {
        vendor = await Vendor.findById(body.vendorId)
          .withDeleted()
          .session(session);
        if (!vendor || vendor.isDeleted) {
          throw new NotFoundError("Vendor not found");
        }
        if (
          normalizeId(vendor.organization?._id || vendor.organization) !==
          normalizeId(organizationId)
        ) {
          throw new ValidationError(
            "vendorId must belong to the same organization"
          );
        }
        if (vendor.status !== VENDOR_STATUS.ACTIVE) {
          throw new ConflictError("Vendor is inactive");
        }
      } else if (body.vendorId) {
        throw new ValidationError("vendorId is only allowed for project tasks");
      }

      const assigneeIds =
        taskType === TASK_TYPE.ASSIGNED
          ? Array.from(
              new Set(
                (Array.isArray(body.assigneeIds) ? body.assigneeIds : [])
                  .map((id) => normalizeId(id))
                  .filter(Boolean)
              )
            )
          : [];

      if (taskType !== TASK_TYPE.ASSIGNED && body.assigneeIds) {
        throw new ValidationError(
          "assigneeIds are only allowed for assigned tasks"
        );
      }

      const assignees = await loadActiveScopedUsers({
        userIds: assigneeIds,
        organizationId,
        departmentId,
        session,
        label: "assigneeIds",
      });

      const routineMaterials =
        taskType === TASK_TYPE.ROUTINE && Array.isArray(body.materials)
          ? body.materials
          : [];

      if (taskType !== TASK_TYPE.ROUTINE && body.materials) {
        throw new ValidationError(
          "materials are only allowed for routine tasks"
        );
      }

      if (taskType === TASK_TYPE.ROUTINE) {
        const deltas = new Map(
          routineMaterials
            .map((entry) => [
              normalizeId(entry.materialId),
              Number(entry.quantity || 0),
            ])
            .filter(([id, qty]) => id && qty > 0)
        );

        await applyMaterialInventoryDeltas({
          deltas,
          organizationId,
          departmentId,
          session,
          requireActive: true,
        });
      }

      const createPayload = {
        type: taskType,
        title: body.title,
        description: body.description,
        status: body.status || TASK_STATUS.TODO,
        priority: body.priority,
        tags,
        watchers: watchers.map((user) => user._id),
        organization: organizationId,
        department: departmentId,
        createdBy: req.user.id,
        ...(taskType === TASK_TYPE.PROJECT
          ? {
              vendor: vendor?._id,
              startDate: body.startDate,
              dueDate: body.dueDate,
            }
          : {}),
        ...(taskType === TASK_TYPE.ASSIGNED
          ? {
              assignees: assignees.map((user) => user._id),
              startDate: body.startDate,
              dueDate: body.dueDate,
            }
          : {}),
        ...(taskType === TASK_TYPE.ROUTINE
          ? {
              date: body.date,
              materials: routineMaterials.map((entry) => ({
                material: entry.materialId,
                quantity: entry.quantity,
              })),
            }
          : {}),
      };

      const created = await Task.create([createPayload], { session });
      const task = Array.isArray(created) ? created[0] : created;

      if ([TASK_TYPE.PROJECT, TASK_TYPE.ASSIGNED].includes(taskType)) {
        await TaskActivity.create(
          [
            {
              parent: task._id,
              parentModel: "Task",
              activity: "Task created",
              organization: organizationId,
              department: departmentId,
              createdBy: req.user.id,
            },
          ],
          { session }
        );
      }

      const notifyRecipients = [
        ...assignees.map((user) => normalizeId(user._id)),
        ...watchers.map((user) => normalizeId(user._id)),
      ].filter((id) => id && id !== normalizeId(req.user.id));

      const notificationRecipientIds = await createNotificationsForUsers({
        recipients: notifyRecipients,
        title: "Task created",
        message: `${body.title} was created.`,
        organizationId,
        departmentId,
        entityModel: "Task",
        entity: task._id,
        session,
      });

      const populated = await Task.findById(task._id)
        .withDeleted()
        .populate("department", "name")
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("vendor", "name status")
        .populate("assignees", "firstName lastName profilePicture")
        .session(session);

      return {
        task: populated,
        notificationRecipientIds,
      };
    });

    const taskId = normalizeId(result.task?._id);
    emitToOrganization({
      organizationId: normalizeId(result.task.organization),
      event: SOCKET_EVENTS.TASK_CREATED,
      payload: { taskId },
    });
    emitToDepartment({
      departmentId: normalizeId(result.task.department),
      event: SOCKET_EVENTS.TASK_CREATED,
      payload: { taskId },
    });
    emitToTask({
      taskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId },
    });

    emitNotificationEvents(result.notificationRecipientIds, {
      entityModel: "Task",
      entityId: taskId,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Task created",
      data: {
        task: toTaskSummary({ task: result.task }),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:taskId
 */
export const getTask = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;

    const task = await Task.findById(taskId)
      .withDeleted()
      .populate("department", "name status")
      .populate("createdBy", "firstName lastName profilePicture")
      .populate("vendor", "name status")
      .populate("assignees", "firstName lastName profilePicture")
      .populate("watchers", "firstName lastName profilePicture email");

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const attachmentsForOverview = await Attachment.find({
      parentModel: "Task",
      parent: task._id,
    })
      .withDeleted()
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "filename fileUrl fileType fileSize uploadedBy createdAt isDeleted"
      )
      .populate("uploadedBy", "firstName lastName profilePicture");

    const files = await loadTaskAttachmentsForFilesTab({
      taskId: task._id,
      session: null,
    });

    let materialsSummary = [];
    if (task.type === TASK_TYPE.ROUTINE) {
      const routineMaterials = Array.isArray(task.materials)
        ? task.materials
        : [];
      const materialIds = routineMaterials
        .map((entry) => normalizeId(entry?.material))
        .filter(Boolean);

      const materials = materialIds.length
        ? await Material.find({
            _id: { $in: materialIds },
            organization: task.organization,
            department: task.department,
            isDeleted: false,
          }).select("name sku unit price inventory.stockOnHand status")
        : [];

      const byId = new Map(
        materials.map((material) => [normalizeId(material._id), material])
      );

      materialsSummary = routineMaterials.map((entry) => {
        const id = normalizeId(entry.material);
        const material = byId.get(id);
        const quantity = Number(entry.quantity || 0);
        const unitPrice = Number(material?.price || 0);

        return {
          material: {
            id,
            name: material?.name || "",
            sku: material?.sku || "",
            unit: material?.unit || "",
            price: unitPrice,
            status: material?.status || "",
            stockOnHand: Number(material?.inventory?.stockOnHand ?? 0),
          },
          quantity,
          cost: quantity * unitPrice,
        };
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        task: {
          ...toTaskSummary({ task }),
          description: task.description,
          watchers: Array.isArray(task.watchers)
            ? task.watchers.map((user) => toUserSummary(user))
            : [],
        },
        overviewAggregates: {
          attachments: attachmentsForOverview.map((attachment) => ({
            id: normalizeId(attachment._id),
            filename: attachment.filename,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            uploadedBy: toUserSummary(attachment.uploadedBy),
            createdAt: attachment.createdAt || null,
            isDeleted: Boolean(attachment.isDeleted),
          })),
          materials: materialsSummary,
          timeline: [],
        },
        files,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId
 */
export const updateTask = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const taskId = req.validated.params.taskId;
    const organizationId = normalizeId(req.user.organization);
    const departmentId = normalizeId(req.user.department);

    const result = await withMongoTransaction(async (session) => {
      const task = await Task.findById(taskId).withDeleted().session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        throw new ConflictError(
          "Cannot update a deleted task. Restore it first."
        );
      }

      const tags = body.tags ? normalizeTags(body.tags) : undefined;

      const watcherIds = body.watchers
        ? Array.from(
            new Set(
              (Array.isArray(body.watchers) ? body.watchers : [])
                .map((id) => normalizeId(id))
                .filter(Boolean)
            )
          )
        : null;

      const watchers = watcherIds
        ? await loadActiveScopedUsers({
            userIds: watcherIds,
            organizationId,
            departmentId,
            session,
            label: "watchers",
          })
        : null;

      if (watchers) {
        const actorId = normalizeId(req.user.id);
        if (actorId && !watcherIds.includes(actorId)) {
          watcherIds.push(actorId);
          const actor = await loadActiveScopedUsers({
            userIds: [actorId],
            organizationId,
            departmentId,
            session,
            label: "watchers",
          });
          watchers.push(actor[0]);
        }
      }

      const previousStatus = task.status;
      const previousPriority = task.priority;
      const previousAssignees = Array.isArray(task.assignees)
        ? task.assignees.map((id) => normalizeId(id))
        : [];

      if (body.title !== undefined) {
        task.title = body.title;
      }
      if (body.description !== undefined) {
        task.description = body.description;
      }
      if (body.status !== undefined) {
        task.status = body.status;
      }
      if (body.priority !== undefined) {
        task.priority = body.priority;
      }
      if (tags !== undefined) {
        task.tags = tags;
      }
      if (watchers) {
        task.watchers = watchers.map((user) => user._id);
      }

      if (body.vendorId) {
        if (task.type !== TASK_TYPE.PROJECT) {
          throw new ValidationError(
            "vendorId is only allowed for project tasks"
          );
        }

        const vendor = await Vendor.findById(body.vendorId)
          .withDeleted()
          .session(session);
        if (!vendor || vendor.isDeleted) {
          throw new NotFoundError("Vendor not found");
        }
        if (
          normalizeId(vendor.organization?._id || vendor.organization) !==
          normalizeId(organizationId)
        ) {
          throw new ValidationError(
            "vendorId must belong to the same organization"
          );
        }
        if (vendor.status !== VENDOR_STATUS.ACTIVE) {
          throw new ConflictError("Vendor is inactive");
        }

        task.vendor = vendor._id;
      }

      if (body.assigneeIds) {
        if (task.type !== TASK_TYPE.ASSIGNED) {
          throw new ValidationError(
            "assigneeIds are only allowed for assigned tasks"
          );
        }

        const assignees = await loadActiveScopedUsers({
          userIds: body.assigneeIds,
          organizationId,
          departmentId,
          session,
          label: "assigneeIds",
        });
        task.assignees = assignees.map((user) => user._id);
      }

      if (body.startDate !== undefined) {
        if (![TASK_TYPE.PROJECT, TASK_TYPE.ASSIGNED].includes(task.type)) {
          throw new ValidationError(
            "startDate is only allowed for project and assigned tasks"
          );
        }
        task.startDate = body.startDate;
      }

      if (body.dueDate !== undefined) {
        if (![TASK_TYPE.PROJECT, TASK_TYPE.ASSIGNED].includes(task.type)) {
          throw new ValidationError(
            "dueDate is only allowed for project and assigned tasks"
          );
        }
        task.dueDate = body.dueDate;
      }

      if (
        [TASK_TYPE.PROJECT, TASK_TYPE.ASSIGNED].includes(task.type) &&
        task.startDate &&
        task.dueDate &&
        new Date(task.dueDate).getTime() <= new Date(task.startDate).getTime()
      ) {
        throw new ValidationError("dueDate must be after startDate");
      }

      if (body.date !== undefined) {
        if (task.type !== TASK_TYPE.ROUTINE) {
          throw new ValidationError("date is only allowed for routine tasks");
        }
        task.date = body.date;
      }

      if (body.materials) {
        if (task.type !== TASK_TYPE.ROUTINE) {
          throw new ValidationError(
            "materials are only allowed for routine tasks"
          );
        }

        const before = Array.isArray(task.materials) ? task.materials : [];
        const after = Array.isArray(body.materials) ? body.materials : [];
        const deltas = computeMaterialQuantityDeltas({
          before,
          after,
        });

        await applyMaterialInventoryDeltas({
          deltas,
          organizationId,
          departmentId,
          session,
          requireActive: true,
        });

        task.materials = after.map((entry) => ({
          material: entry.materialId,
          quantity: entry.quantity,
        }));
      }

      await task.save({ session });

      if (task.type !== TASK_TYPE.ROUTINE) {
        const events = [];
        if (body.status !== undefined && body.status !== previousStatus) {
          events.push(
            `Status changed from ${previousStatus || ""} to ${
              task.status || ""
            }`.trim()
          );
        }
        if (body.priority !== undefined && body.priority !== previousPriority) {
          events.push(
            `Priority changed from ${previousPriority || ""} to ${
              task.priority || ""
            }`.trim()
          );
        }

        if (events.length) {
          await TaskActivity.create(
            events.map((activity) => ({
              parent: task._id,
              parentModel: "Task",
              activity,
              organization: organizationId,
              department: departmentId,
              createdBy: req.user.id,
            })),
            { session }
          );
        }
      }

      const currentWatchers = Array.isArray(task.watchers)
        ? task.watchers.map((id) => normalizeId(id))
        : [];
      const currentAssignees = Array.isArray(task.assignees)
        ? task.assignees.map((id) => normalizeId(id))
        : [];

      const notifyRecipients = [...currentWatchers, ...currentAssignees].filter(
        (id) => id && id !== normalizeId(req.user.id)
      );

      const newlyAssigned = currentAssignees.filter(
        (id) => !previousAssignees.includes(id)
      );

      const recipientIds = await createNotificationsForUsers({
        recipients: notifyRecipients,
        title: "Task updated",
        message: `${task.title} was updated.`,
        organizationId,
        departmentId,
        entityModel: "Task",
        entity: task._id,
        session,
      });

      const assignmentRecipientIds = newlyAssigned.length
        ? await createNotificationsForUsers({
            recipients: newlyAssigned.filter(
              (id) => id !== normalizeId(req.user.id)
            ),
            title: "Task assigned",
            message: `You were assigned to: ${task.title}.`,
            organizationId,
            departmentId,
            entityModel: "Task",
            entity: task._id,
            session,
          })
        : [];

      const populated = await Task.findById(task._id)
        .withDeleted()
        .populate("department", "name")
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("vendor", "name status")
        .populate("assignees", "firstName lastName profilePicture")
        .session(session);

      return {
        task: populated,
        notificationRecipients: Array.from(
          new Set([...recipientIds, ...assignmentRecipientIds])
        ),
      };
    });

    const updatedTaskId = normalizeId(result.task._id);
    emitToOrganization({
      organizationId: normalizeId(result.task.organization),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: updatedTaskId },
    });
    emitToDepartment({
      departmentId: normalizeId(result.task.department),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: updatedTaskId },
    });
    emitToTask({
      taskId: updatedTaskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: updatedTaskId },
    });

    emitNotificationEvents(result.notificationRecipients, {
      entityModel: "Task",
      entityId: updatedTaskId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task updated",
      data: {
        task: toTaskSummary({ task: result.task }),
      },
    });
  } catch (error) {
    next(error);
  }
});

const cascadeDeleteComments = async ({
  seedIds = [],
  organizationId,
  departmentId,
  actorId,
  deletedAt,
  session,
}) => {
  const allIds = new Set(
    (seedIds || []).map((id) => normalizeId(id)).filter(Boolean)
  );
  let frontier = Array.from(allIds);

  for (let depth = 0; depth < 6 && frontier.length > 0; depth += 1) {
    const children = await TaskComment.find({
      organization: organizationId,
      department: departmentId,
      parentModel: "TaskComment",
      parent: { $in: frontier },
      isDeleted: false,
    })
      .select("_id")
      .session(session);

    const next = [];
    children.forEach((child) => {
      const id = normalizeId(child._id);
      if (!id || allIds.has(id)) {
        return;
      }

      allIds.add(id);
      next.push(id);
    });

    frontier = next;
  }

  const ids = Array.from(allIds).filter(Boolean);
  if (!ids.length) {
    return [];
  }

  await TaskComment.updateMany(
    {
      _id: { $in: ids },
      organization: organizationId,
      department: departmentId,
      isDeleted: false,
    },
    { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
    { session }
  );

  await Attachment.updateMany(
    {
      parentModel: "TaskComment",
      parent: { $in: ids },
      organization: organizationId,
      department: departmentId,
      isDeleted: false,
    },
    { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
    { session }
  );

  await Notification.updateMany(
    {
      entityModel: "TaskComment",
      entity: { $in: ids },
      organization: organizationId,
      department: departmentId,
      isDeleted: false,
    },
    { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
    { session }
  );

  return ids;
};

/**
 * DELETE /api/tasks/:taskId
 */
export const deleteTask = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const actorId = normalizeId(req.user.id);

    const result = await withMongoTransaction(async (session) => {
      const task = await Task.findById(taskId).withDeleted().session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        return {
          alreadyDeleted: true,
          taskId: normalizeId(task._id),
          organizationId: normalizeId(task.organization),
          departmentId: normalizeId(task.department),
        };
      }

      const deletedAt = new Date();
      await task.softDelete(actorId, session);

      const organizationId = normalizeId(task.organization);
      const departmentId = normalizeId(task.department);

      if (task.type === TASK_TYPE.ROUTINE) {
        const routineDeltas = new Map(
          (Array.isArray(task.materials) ? task.materials : [])
            .map((entry) => [
              normalizeId(entry.material),
              -Number(entry.quantity || 0),
            ])
            .filter(([id, qty]) => id && qty < 0)
        );

        await applyMaterialInventoryDeltas({
          deltas: routineDeltas,
          organizationId,
          departmentId,
          session,
          requireActive: false,
        });
      }

      const activities = await TaskActivity.find({
        parentModel: "Task",
        parent: task._id,
        organization: organizationId,
        department: departmentId,
      })
        .withDeleted()
        .session(session);

      const activeActivities = activities.filter(
        (activity) => !activity.isDeleted
      );

      for (const activity of activeActivities) {
        const deltas = new Map(
          (Array.isArray(activity.materials) ? activity.materials : [])
            .map((entry) => [
              normalizeId(entry.material),
              -Number(entry.quantity || 0),
            ])
            .filter(([id, qty]) => id && qty < 0)
        );

        await applyMaterialInventoryDeltas({
          deltas,
          organizationId,
          departmentId,
          session,
          requireActive: false,
        });

        await activity.softDelete(actorId, session);
      }

      await Attachment.updateMany(
        {
          parentModel: "Task",
          parent: task._id,
          organization: organizationId,
          department: departmentId,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await Attachment.updateMany(
        {
          parentModel: "TaskActivity",
          parent: { $in: activities.map((a) => a._id) },
          organization: organizationId,
          department: departmentId,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await Notification.updateMany(
        {
          entityModel: "Task",
          entity: task._id,
          organization: organizationId,
          department: departmentId,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );
      await Notification.updateMany(
        {
          entityModel: "TaskActivity",
          entity: { $in: activities.map((a) => a._id) },
          organization: organizationId,
          department: departmentId,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      const rootComments = await TaskComment.find({
        parentModel: "Task",
        parent: task._id,
        organization: organizationId,
        department: departmentId,
        isDeleted: false,
      })
        .select("_id")
        .session(session);

      const activityComments = await TaskComment.find({
        parentModel: "TaskActivity",
        parent: { $in: activities.map((a) => a._id) },
        organization: organizationId,
        department: departmentId,
        isDeleted: false,
      })
        .select("_id")
        .session(session);

      await TaskComment.updateMany(
        {
          _id: {
            $in: [
              ...rootComments.map((c) => c._id),
              ...activityComments.map((c) => c._id),
            ],
          },
          organization: organizationId,
          department: departmentId,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await cascadeDeleteComments({
        seedIds: [
          ...rootComments.map((c) => c._id),
          ...activityComments.map((c) => c._id),
        ],
        organizationId,
        departmentId,
        actorId,
        deletedAt,
        session,
      });

      return {
        alreadyDeleted: false,
        taskId: normalizeId(task._id),
        organizationId,
        departmentId,
      };
    });

    if (result.alreadyDeleted) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Task already deleted",
      });
      return;
    }

    emitToOrganization({
      organizationId: result.organizationId,
      event: SOCKET_EVENTS.TASK_DELETED,
      payload: { taskId: result.taskId },
    });
    emitToDepartment({
      departmentId: result.departmentId,
      event: SOCKET_EVENTS.TASK_DELETED,
      payload: { taskId: result.taskId },
    });
    emitToTask({
      taskId: result.taskId,
      event: SOCKET_EVENTS.TASK_DELETED,
      payload: { taskId: result.taskId },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    next(error);
  }
});

const cascadeRestoreComments = async ({
  seedIds = [],
  organizationId,
  departmentId,
  session,
}) => {
  const allIds = new Set(
    (seedIds || []).map((id) => normalizeId(id)).filter(Boolean)
  );
  let frontier = Array.from(allIds);

  for (let depth = 0; depth < 6 && frontier.length > 0; depth += 1) {
    const children = await TaskComment.find({
      organization: organizationId,
      department: departmentId,
      parentModel: "TaskComment",
      parent: { $in: frontier },
      isDeleted: true,
    })
      .select("_id")
      .session(session);

    const next = [];
    children.forEach((child) => {
      const id = normalizeId(child._id);
      if (!id || allIds.has(id)) {
        return;
      }

      allIds.add(id);
      next.push(id);
    });

    frontier = next;
  }

  const ids = Array.from(allIds).filter(Boolean);
  if (!ids.length) {
    return [];
  }

  await TaskComment.updateMany(
    {
      _id: { $in: ids },
      organization: organizationId,
      department: departmentId,
      isDeleted: true,
    },
    { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
    { session }
  );

  await Attachment.updateMany(
    {
      parentModel: "TaskComment",
      parent: { $in: ids },
      organization: organizationId,
      department: departmentId,
      isDeleted: true,
    },
    { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
    { session }
  );

  await Notification.updateMany(
    {
      entityModel: "TaskComment",
      entity: { $in: ids },
      organization: organizationId,
      department: departmentId,
      isDeleted: true,
    },
    { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
    { session }
  );

  return ids;
};

/**
 * PATCH /api/tasks/:taskId/restore
 */
export const restoreTask = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;

    const result = await withMongoTransaction(async (session) => {
      const task = await Task.findById(taskId).withDeleted().session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (!task.isDeleted) {
        const populated = await Task.findById(task._id)
          .withDeleted()
          .populate("department", "name")
          .populate("createdBy", "firstName lastName profilePicture")
          .populate("vendor", "name status")
          .populate("assignees", "firstName lastName profilePicture")
          .session(session);

        return {
          alreadyActive: true,
          task: populated,
          organizationId: normalizeId(task.organization),
          departmentId: normalizeId(task.department),
        };
      }

      const organizationId = normalizeId(task.organization);
      const departmentId = normalizeId(task.department);

      if (task.type === TASK_TYPE.ROUTINE) {
        const routineDeltas = new Map(
          (Array.isArray(task.materials) ? task.materials : [])
            .map((entry) => [
              normalizeId(entry.material),
              Number(entry.quantity || 0),
            ])
            .filter(([id, qty]) => id && qty > 0)
        );

        await applyMaterialInventoryDeltas({
          deltas: routineDeltas,
          organizationId,
          departmentId,
          session,
          requireActive: false,
        });
      }

      const activities = await TaskActivity.find({
        parentModel: "Task",
        parent: task._id,
        organization: organizationId,
        department: departmentId,
      })
        .withDeleted()
        .session(session);

      const deletedActivities = activities.filter(
        (activity) => activity.isDeleted
      );
      for (const activity of deletedActivities) {
        const deltas = new Map(
          (Array.isArray(activity.materials) ? activity.materials : [])
            .map((entry) => [
              normalizeId(entry.material),
              Number(entry.quantity || 0),
            ])
            .filter(([id, qty]) => id && qty > 0)
        );

        await applyMaterialInventoryDeltas({
          deltas,
          organizationId,
          departmentId,
          session,
          requireActive: false,
        });

        await activity.restore(session);
      }

      await task.restore(session);

      await Attachment.updateMany(
        {
          parentModel: "Task",
          parent: task._id,
          organization: organizationId,
          department: departmentId,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await Attachment.updateMany(
        {
          parentModel: "TaskActivity",
          parent: { $in: activities.map((a) => a._id) },
          organization: organizationId,
          department: departmentId,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await Notification.updateMany(
        {
          entityModel: "Task",
          entity: task._id,
          organization: organizationId,
          department: departmentId,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );
      await Notification.updateMany(
        {
          entityModel: "TaskActivity",
          entity: { $in: activities.map((a) => a._id) },
          organization: organizationId,
          department: departmentId,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      const rootComments = await TaskComment.find({
        parentModel: "Task",
        parent: task._id,
        organization: organizationId,
        department: departmentId,
        isDeleted: true,
      })
        .select("_id")
        .session(session);

      const activityComments = await TaskComment.find({
        parentModel: "TaskActivity",
        parent: { $in: activities.map((a) => a._id) },
        organization: organizationId,
        department: departmentId,
        isDeleted: true,
      })
        .select("_id")
        .session(session);

      await TaskComment.updateMany(
        {
          _id: {
            $in: [
              ...rootComments.map((c) => c._id),
              ...activityComments.map((c) => c._id),
            ],
          },
          organization: organizationId,
          department: departmentId,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await cascadeRestoreComments({
        seedIds: [
          ...rootComments.map((c) => c._id),
          ...activityComments.map((c) => c._id),
        ],
        organizationId,
        departmentId,
        session,
      });

      const populated = await Task.findById(task._id)
        .withDeleted()
        .populate("department", "name")
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("vendor", "name status")
        .populate("assignees", "firstName lastName profilePicture")
        .session(session);

      return {
        alreadyActive: false,
        task: populated,
        organizationId,
        departmentId,
      };
    });

    if (result.alreadyActive) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Task is already active",
        data: {
          task: toTaskSummary({ task: result.task }),
        },
      });
      return;
    }

    const restoredTaskId = normalizeId(result.task._id);
    emitToOrganization({
      organizationId: result.organizationId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: restoredTaskId },
    });
    emitToDepartment({
      departmentId: result.departmentId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: restoredTaskId },
    });
    emitToTask({
      taskId: restoredTaskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: restoredTaskId },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task restored",
      data: {
        task: toTaskSummary({ task: result.task }),
      },
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      next(new ConflictError("Insufficient stock to restore"));
      return;
    }
    next(error);
  }
});

export default {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  restoreTask,
};
