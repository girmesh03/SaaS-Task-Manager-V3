/**
 * @file Task activity controllers (Phase 4).
 */
import asyncHandler from "express-async-handler";
import {
  Attachment,
  Notification,
  Task,
  TaskActivity,
  TaskComment,
} from "../models/index.js";
import { HTTP_STATUS, SOCKET_EVENTS, TASK_TYPE } from "../utils/constants.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { normalizeId, parsePagination, withMongoTransaction } from "../utils/helpers.js";
import { buildPaginationMeta, computeMaterialQuantityDeltas } from "../utils/taskHelpers.js";
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

const toMaterialSummary = (material) => ({
  id: normalizeId(material?._id),
  name: material?.name || "",
  sku: material?.sku || "",
  unit: material?.unit || "",
  price: Number(material?.price || 0),
  status: material?.status || "",
});

const toAttachmentSummary = (attachment) => ({
  id: normalizeId(attachment?._id),
  filename: attachment?.filename || "",
  fileUrl: attachment?.fileUrl || "",
  fileType: attachment?.fileType || "",
  fileSize: Number(attachment?.fileSize || 0),
  uploadedBy: toUserSummary(attachment?.uploadedBy),
  createdAt: attachment?.createdAt || null,
  isDeleted: Boolean(attachment?.isDeleted),
});

const resolveTaskIdForParent = async ({ parentModel, parentId, session }) => {
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

    return resolveTaskIdForParent({
      parentModel: activity.parentModel,
      parentId: activity.parent,
      session,
    });
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
        return resolveTaskIdForParent({
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

const createNotificationsForUsers = async ({
  recipients = [],
  title,
  message,
  organizationId,
  departmentId,
  entityModel = "TaskActivity",
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
    return ids;
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
    return ids;
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
 * GET /api/tasks/:taskId/activities
 */
export const listTaskActivities = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const query = req.validated.query;
    const pagination = parsePagination(query);

    const parentModel = query.parentModel || "Task";
    const parentId = query.parentId || taskId;

    if (parentModel === "Task" && normalizeId(parentId) !== normalizeId(taskId)) {
      throw new ValidationError("parentId must match taskId when parentModel is Task");
    }

    if (parentModel !== "Task") {
      const resolved = await resolveTaskIdForParent({
        parentModel,
        parentId,
        session: null,
      });
      if (!resolved) {
        throw new NotFoundError("Parent not found");
      }
      if (normalizeId(resolved) !== normalizeId(taskId)) {
        throw new ValidationError("parentId must belong to the requested task");
      }
    }

    const task = await Task.findById(taskId).withDeleted().select("organization department");
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const filter = {
      parentModel,
      parent: parentId,
      organization: task.organization,
      department: task.department,
    };

    const paginationResult = await TaskActivity.paginate(filter, {
      ...pagination.paginateOptions,
      populate: [
        { path: "createdBy", select: "firstName lastName profilePicture" },
        { path: "materials.material", select: "name sku unit price status" },
      ],
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    const activities = paginationResult.docs || [];
    const activityIds = activities.map((activity) => activity._id);

    const attachmentQuery = Attachment.find({
      parentModel: "TaskActivity",
      parent: { $in: activityIds },
      organization: task.organization,
      department: task.department,
    })
      .sort({ createdAt: -1 })
      .select("filename fileUrl fileType fileSize parent uploadedBy createdAt isDeleted")
      .populate("uploadedBy", "firstName lastName profilePicture");

    if (pagination.includeDeleted) {
      attachmentQuery.withDeleted();
    }

    const attachments = activityIds.length ? await attachmentQuery.exec() : [];
    const attachmentsByParent = new Map();
    attachments.forEach((attachment) => {
      const key = normalizeId(attachment.parent);
      if (!key) {
        return;
      }
      const existing = attachmentsByParent.get(key) || [];
      attachmentsByParent.set(key, [...existing, attachment]);
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        activities: activities.map((activity) => ({
          id: normalizeId(activity._id),
          parentModel: activity.parentModel,
          parent: normalizeId(activity.parent),
          activity: activity.activity,
          materials: Array.isArray(activity.materials)
            ? activity.materials.map((entry) => ({
                material: toMaterialSummary(entry.material),
                quantity: Number(entry.quantity || 0),
              }))
            : [],
          attachments: (attachmentsByParent.get(normalizeId(activity._id)) || []).map(
            toAttachmentSummary
          ),
          createdBy: toUserSummary(activity.createdBy),
          createdAt: activity.createdAt || null,
          updatedAt: activity.updatedAt || null,
          isDeleted: Boolean(activity.isDeleted),
        })),
        pagination: buildPaginationMeta(paginationResult),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:taskId/activities
 */
export const createTaskActivity = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const taskId = req.validated.params.taskId;
    const actorId = normalizeId(req.user.id);

    const parentModel = body.parentModel || "Task";
    const parentId = body.parentId || taskId;

    if (parentModel !== "Task") {
      throw new ValidationError("parentModel must be Task for this endpoint");
    }

    if (normalizeId(parentId) !== normalizeId(taskId)) {
      throw new ValidationError("parentId must match taskId when parentModel is Task");
    }

    const result = await withMongoTransaction(async (session) => {
      const task = await Task.findById(taskId)
        .withDeleted()
        .select("type title organization department watchers assignees isDeleted")
        .session(session);

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        throw new ConflictError("Cannot add activities to a deleted task. Restore it first.");
      }

      if (task.type === TASK_TYPE.ROUTINE) {
        throw new ConflictError("Cannot create activities for routine tasks");
      }

      const deltas = new Map(
        (Array.isArray(body.materials) ? body.materials : [])
          .map((entry) => [normalizeId(entry.materialId), Number(entry.quantity || 0)])
          .filter(([id, qty]) => id && qty > 0)
      );

      await applyMaterialInventoryDeltas({
        deltas,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
        requireActive: true,
      });

      const activityPayload = {
        parent: task._id,
        parentModel: "Task",
        activity: body.activity,
        materials: (Array.isArray(body.materials) ? body.materials : [])
          .map((entry) => ({
            material: entry.materialId,
            quantity: entry.quantity,
          }))
          .filter((entry) => entry.material && Number(entry.quantity || 0) > 0),
        organization: task.organization,
        department: task.department,
        createdBy: actorId,
      };

      const created = await TaskActivity.create([activityPayload], { session });
      const activity = Array.isArray(created) ? created[0] : created;

      const recipients = [
        ...(Array.isArray(task.watchers) ? task.watchers : []),
        ...(Array.isArray(task.assignees) ? task.assignees : []),
      ]
        .map((id) => normalizeId(id))
        .filter((id) => id && id !== actorId);

      const notificationRecipients = await createNotificationsForUsers({
        recipients,
        title: "New activity",
        message: `A new activity was added to: ${task.title}.`,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        entityModel: "TaskActivity",
        entity: activity._id,
        session,
      });

      const populated = await TaskActivity.findById(activity._id)
        .withDeleted()
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("materials.material", "name sku unit price status")
        .session(session);

      return {
        task,
        activity: populated,
        notificationRecipients,
      };
    });

    const resolvedTaskId = normalizeId(result.task._id);
    emitToTask({
      taskId: resolvedTaskId,
      event: SOCKET_EVENTS.TASK_ACTIVITY_ADDED,
      payload: { taskId: resolvedTaskId, activityId: normalizeId(result.activity._id) },
    });
    emitToOrganization({
      organizationId: normalizeId(result.task.organization),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToDepartment({
      departmentId: normalizeId(result.task.department),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToTask({
      taskId: resolvedTaskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });

    emitNotificationEvents(result.notificationRecipients, {
      entityModel: "TaskActivity",
      entityId: normalizeId(result.activity._id),
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Task activity created",
      data: {
        activity: {
          id: normalizeId(result.activity._id),
          parentModel: result.activity.parentModel,
          parent: normalizeId(result.activity.parent),
          activity: result.activity.activity,
          materials: Array.isArray(result.activity.materials)
            ? result.activity.materials.map((entry) => ({
                material: toMaterialSummary(entry.material),
                quantity: Number(entry.quantity || 0),
              }))
            : [],
          attachments: [],
          createdBy: toUserSummary(result.activity.createdBy),
          createdAt: result.activity.createdAt || null,
          updatedAt: result.activity.updatedAt || null,
          isDeleted: Boolean(result.activity.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:taskId/activities/:activityId
 */
export const getTaskActivity = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const activityId = req.validated.params.activityId;

    const activity = await TaskActivity.findById(activityId)
      .withDeleted()
      .populate("createdBy", "firstName lastName profilePicture")
      .populate("materials.material", "name sku unit price status");

    if (!activity) {
      throw new NotFoundError("Task activity not found");
    }

    if (
      activity.parentModel !== "Task" ||
      normalizeId(activity.parent) !== normalizeId(taskId)
    ) {
      throw new NotFoundError("Task activity not found");
    }

    const attachmentQuery = Attachment.find({
      parentModel: "TaskActivity",
      parent: activity._id,
    })
      .withDeleted()
      .sort({ createdAt: -1 })
      .select("filename fileUrl fileType fileSize uploadedBy createdAt isDeleted")
      .populate("uploadedBy", "firstName lastName profilePicture");

    const attachments = await attachmentQuery.exec();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        activity: {
          id: normalizeId(activity._id),
          parentModel: activity.parentModel,
          parent: normalizeId(activity.parent),
          activity: activity.activity,
          materials: Array.isArray(activity.materials)
            ? activity.materials.map((entry) => ({
                material: toMaterialSummary(entry.material),
                quantity: Number(entry.quantity || 0),
              }))
            : [],
          attachments: attachments.map(toAttachmentSummary),
          createdBy: toUserSummary(activity.createdBy),
          createdAt: activity.createdAt || null,
          updatedAt: activity.updatedAt || null,
          isDeleted: Boolean(activity.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId/activities/:activityId
 */
export const updateTaskActivity = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const taskId = req.validated.params.taskId;
    const activityId = req.validated.params.activityId;

    const result = await withMongoTransaction(async (session) => {
      const activity = await TaskActivity.findById(activityId)
        .withDeleted()
        .session(session);
      if (!activity) {
        throw new NotFoundError("Task activity not found");
      }

      if (
        activity.parentModel !== "Task" ||
        normalizeId(activity.parent) !== normalizeId(taskId)
      ) {
        throw new NotFoundError("Task activity not found");
      }

      if (activity.isDeleted) {
        throw new ConflictError("Cannot update a deleted task activity. Restore it first.");
      }

      const task = await Task.findById(taskId)
        .withDeleted()
        .select("type organization department isDeleted")
        .session(session);

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        throw new ConflictError("Cannot update task activity for a deleted task.");
      }

      if (task.type === TASK_TYPE.ROUTINE) {
        throw new ConflictError("Cannot update activities for routine tasks");
      }

      if (body.activity !== undefined) {
        activity.activity = body.activity;
      }

      if (body.materials) {
        const before = Array.isArray(activity.materials) ? activity.materials : [];
        const after = Array.isArray(body.materials) ? body.materials : [];
        const deltas = computeMaterialQuantityDeltas({ before, after });

        await applyMaterialInventoryDeltas({
          deltas,
          organizationId: normalizeId(task.organization),
          departmentId: normalizeId(task.department),
          session,
          requireActive: true,
        });

        activity.materials = after
          .map((entry) => ({
            material: entry.materialId,
            quantity: entry.quantity,
          }))
          .filter((entry) => entry.material && Number(entry.quantity || 0) > 0);
      }

      await activity.save({ session });

      const populated = await TaskActivity.findById(activity._id)
        .withDeleted()
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("materials.material", "name sku unit price status")
        .session(session);

      return {
        task,
        activity: populated,
      };
    });

    const resolvedTaskId = normalizeId(result.task._id);
    emitToOrganization({
      organizationId: normalizeId(result.task.organization),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToDepartment({
      departmentId: normalizeId(result.task.department),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToTask({
      taskId: resolvedTaskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task activity updated",
      data: {
        activity: {
          id: normalizeId(result.activity._id),
          parentModel: result.activity.parentModel,
          parent: normalizeId(result.activity.parent),
          activity: result.activity.activity,
          materials: Array.isArray(result.activity.materials)
            ? result.activity.materials.map((entry) => ({
                material: toMaterialSummary(entry.material),
                quantity: Number(entry.quantity || 0),
              }))
            : [],
          createdBy: toUserSummary(result.activity.createdBy),
          createdAt: result.activity.createdAt || null,
          updatedAt: result.activity.updatedAt || null,
          isDeleted: Boolean(result.activity.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:taskId/activities/:activityId
 */
export const deleteTaskActivity = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const activityId = req.validated.params.activityId;
    const actorId = normalizeId(req.user.id);

    const result = await withMongoTransaction(async (session) => {
      const activity = await TaskActivity.findById(activityId)
        .withDeleted()
        .session(session);

      if (!activity) {
        throw new NotFoundError("Task activity not found");
      }

      if (
        activity.parentModel !== "Task" ||
        normalizeId(activity.parent) !== normalizeId(taskId)
      ) {
        throw new NotFoundError("Task activity not found");
      }

      const task = await Task.findById(taskId)
        .withDeleted()
        .select("organization department isDeleted")
        .session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        throw new ConflictError("Cannot delete task activity for a deleted task.");
      }

      if (activity.isDeleted) {
        return {
          alreadyDeleted: true,
          task,
          activity,
        };
      }

      const deletedAt = new Date();

      const deltas = new Map(
        (Array.isArray(activity.materials) ? activity.materials : [])
          .map((entry) => [normalizeId(entry.material), -Number(entry.quantity || 0)])
          .filter(([id, qty]) => id && qty < 0)
      );

      await applyMaterialInventoryDeltas({
        deltas,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
        requireActive: false,
      });

      await activity.softDelete(actorId, session);

      await Attachment.updateMany(
        {
          parentModel: "TaskActivity",
          parent: activity._id,
          organization: task.organization,
          department: task.department,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await Notification.updateMany(
        {
          entityModel: "TaskActivity",
          entity: activity._id,
          organization: task.organization,
          department: task.department,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      const rootComments = await TaskComment.find({
        parentModel: "TaskActivity",
        parent: activity._id,
        organization: task.organization,
        department: task.department,
        isDeleted: false,
      })
        .select("_id")
        .session(session);

      await TaskComment.updateMany(
        {
          _id: { $in: rootComments.map((comment) => comment._id) },
          organization: task.organization,
          department: task.department,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await cascadeDeleteComments({
        seedIds: rootComments.map((comment) => comment._id),
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        actorId,
        deletedAt,
        session,
      });

      return {
        alreadyDeleted: false,
        task,
        activity,
      };
    });

    if (result.alreadyDeleted) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Task activity already deleted",
      });
      return;
    }

    const resolvedTaskId = normalizeId(result.task._id);
    emitToOrganization({
      organizationId: normalizeId(result.task.organization),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToDepartment({
      departmentId: normalizeId(result.task.department),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToTask({
      taskId: resolvedTaskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task activity deleted",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/tasks/:taskId/activities/:activityId/restore
 */
export const restoreTaskActivity = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const activityId = req.validated.params.activityId;

    const result = await withMongoTransaction(async (session) => {
      const activity = await TaskActivity.findById(activityId)
        .withDeleted()
        .session(session);

      if (!activity) {
        throw new NotFoundError("Task activity not found");
      }

      if (
        activity.parentModel !== "Task" ||
        normalizeId(activity.parent) !== normalizeId(taskId)
      ) {
        throw new NotFoundError("Task activity not found");
      }

      const task = await Task.findById(taskId)
        .withDeleted()
        .select("organization department isDeleted")
        .session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        throw new ConflictError("Cannot restore task activity for a deleted task.");
      }

      if (!activity.isDeleted) {
        const populated = await TaskActivity.findById(activity._id)
          .withDeleted()
          .populate("createdBy", "firstName lastName profilePicture")
          .populate("materials.material", "name sku unit price status")
          .session(session);

        return {
          alreadyActive: true,
          task,
          activity: populated,
        };
      }

      const deltas = new Map(
        (Array.isArray(activity.materials) ? activity.materials : [])
          .map((entry) => [normalizeId(entry.material), Number(entry.quantity || 0)])
          .filter(([id, qty]) => id && qty > 0)
      );

      await applyMaterialInventoryDeltas({
        deltas,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
        requireActive: false,
      });

      await activity.restore(session);

      await Attachment.updateMany(
        {
          parentModel: "TaskActivity",
          parent: activity._id,
          organization: task.organization,
          department: task.department,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await Notification.updateMany(
        {
          entityModel: "TaskActivity",
          entity: activity._id,
          organization: task.organization,
          department: task.department,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      const rootComments = await TaskComment.find({
        parentModel: "TaskActivity",
        parent: activity._id,
        organization: task.organization,
        department: task.department,
        isDeleted: true,
      })
        .select("_id")
        .session(session);

      await TaskComment.updateMany(
        {
          _id: { $in: rootComments.map((comment) => comment._id) },
          organization: task.organization,
          department: task.department,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await cascadeRestoreComments({
        seedIds: rootComments.map((comment) => comment._id),
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
      });

      const populated = await TaskActivity.findById(activity._id)
        .withDeleted()
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("materials.material", "name sku unit price status")
        .session(session);

      return {
        alreadyActive: false,
        task,
        activity: populated,
      };
    });

    const resolvedTaskId = normalizeId(result.task._id);
    emitToOrganization({
      organizationId: normalizeId(result.task.organization),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToDepartment({
      departmentId: normalizeId(result.task.department),
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });
    emitToTask({
      taskId: resolvedTaskId,
      event: SOCKET_EVENTS.TASK_UPDATED,
      payload: { taskId: resolvedTaskId },
    });

    if (result.alreadyActive) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Task activity is already active",
        data: {
          activity: {
            id: normalizeId(result.activity._id),
            parentModel: result.activity.parentModel,
            parent: normalizeId(result.activity.parent),
            activity: result.activity.activity,
            materials: Array.isArray(result.activity.materials)
              ? result.activity.materials.map((entry) => ({
                  material: toMaterialSummary(entry.material),
                  quantity: Number(entry.quantity || 0),
                }))
              : [],
            createdBy: toUserSummary(result.activity.createdBy),
            createdAt: result.activity.createdAt || null,
            updatedAt: result.activity.updatedAt || null,
            isDeleted: Boolean(result.activity.isDeleted),
          },
        },
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task activity restored",
      data: {
        activity: {
          id: normalizeId(result.activity._id),
          parentModel: result.activity.parentModel,
          parent: normalizeId(result.activity.parent),
          activity: result.activity.activity,
          materials: Array.isArray(result.activity.materials)
            ? result.activity.materials.map((entry) => ({
                material: toMaterialSummary(entry.material),
                quantity: Number(entry.quantity || 0),
              }))
            : [],
          createdBy: toUserSummary(result.activity.createdBy),
          createdAt: result.activity.createdAt || null,
          updatedAt: result.activity.updatedAt || null,
          isDeleted: Boolean(result.activity.isDeleted),
        },
      },
    });
  } catch (error) {
    if (error instanceof ConflictError && error.message === "Insufficient stock") {
      next(new ConflictError("Insufficient stock to restore"));
      return;
    }
    next(error);
  }
});

export default {
  listTaskActivities,
  createTaskActivity,
  getTaskActivity,
  updateTaskActivity,
  deleteTaskActivity,
  restoreTaskActivity,
};
