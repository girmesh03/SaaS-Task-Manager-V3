/**
 * @file Attachment controllers (Phase 4 - task contexts only).
 */
import asyncHandler from "express-async-handler";
import {
  Attachment,
  Task,
  TaskActivity,
  TaskComment,
} from "../models/index.js";
import { HTTP_STATUS, SOCKET_EVENTS } from "../utils/constants.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
import { normalizeId, withMongoTransaction } from "../utils/helpers.js";
import { isPlatformSuperAdmin } from "../utils/taskHelpers.js";
import { createNotificationSafe } from "../services/notificationService.js";
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

const toAttachmentSummary = (attachment) => ({
  id: normalizeId(attachment?._id),
  filename: attachment?.filename || "",
  fileUrl: attachment?.fileUrl || "",
  fileType: attachment?.fileType || "",
  fileSize: Number(attachment?.fileSize || 0),
  parentModel: attachment?.parentModel || "",
  parent: normalizeId(attachment?.parent),
  uploadedBy: toUserSummary(attachment?.uploadedBy),
  createdAt: attachment?.createdAt || null,
  isDeleted: Boolean(attachment?.isDeleted),
});

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

const loadAttachmentParent = async ({ parentModel, parentId, session }) => {
  if (parentModel === "Task") {
    return Task.findById(parentId).withDeleted().session(session);
  }

  if (parentModel === "TaskActivity") {
    return TaskActivity.findById(parentId).withDeleted().session(session);
  }

  if (parentModel === "TaskComment") {
    return TaskComment.findById(parentId).withDeleted().session(session);
  }

  return null;
};

/**
 * POST /api/attachments
 */
export const createAttachment = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const actorId = normalizeId(req.user.id);

    const result = await withMongoTransaction(async (session) => {
      const parent = await loadAttachmentParent({
        parentModel: body.parentModel,
        parentId: body.parent,
        session,
      });

      if (!parent) {
        throw new NotFoundError("Attachment parent not found");
      }

      if (parent.isDeleted) {
        throw new ConflictError(
          "Cannot upload files to a deleted parent. Restore it first."
        );
      }

      if (!isPlatformSuperAdmin(req.user)) {
        const sameOrg =
          normalizeId(parent.organization?._id || parent.organization) ===
          normalizeId(req.user.organization);
        const sameDept =
          normalizeId(parent.department?._id || parent.department) ===
          normalizeId(req.user.department);

        if (!sameOrg) {
          throw new UnauthorizedError(
            "Cross-organization access is not allowed"
          );
        }
        if (!sameDept) {
          throw new UnauthorizedError("Cross-department access is not allowed");
        }
      }

      const created = await Attachment.create(
        [
          {
            filename: body.filename,
            fileUrl: body.fileUrl,
            fileType: body.fileType,
            fileSize: body.fileSize,
            parent: parent._id,
            parentModel: body.parentModel,
            organization: parent.organization,
            department: parent.department,
            uploadedBy: actorId,
          },
        ],
        { session }
      );

      const attachment = Array.isArray(created) ? created[0] : created;

      const taskId = await resolveTaskIdForParent({
        parentModel: body.parentModel,
        parentId: parent._id,
        session,
      });

      const task = taskId
        ? await Task.findById(taskId)
            .withDeleted()
            .select(
              "title watchers assignees organization department isDeleted"
            )
            .session(session)
        : null;

      if (!task) {
        return {
          task: null,
          attachment,
          notificationRecipients: [],
        };
      }

      if (task.isDeleted) {
        throw new ConflictError(
          "Cannot upload files to a deleted task. Restore it first."
        );
      }

      const recipients = [
        ...(Array.isArray(task.watchers) ? task.watchers : []),
        ...(Array.isArray(task.assignees) ? task.assignees : []),
      ]
        .map((id) => normalizeId(id))
        .filter((id) => id && id !== actorId);

      const notificationRecipients = await createNotificationsForUsers({
        recipients,
        title: "File uploaded",
        message: `${body.filename} was uploaded to: ${task.title}.`,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        entityModel: "Task",
        entity: task._id,
        session,
      });

      const populated = await Attachment.findById(attachment._id)
        .withDeleted()
        .populate("uploadedBy", "firstName lastName profilePicture")
        .session(session);

      return {
        task,
        attachment: populated,
        notificationRecipients,
      };
    });

    const taskId = normalizeId(result.task?._id);
    if (taskId) {
      emitToTask({
        taskId,
        event: SOCKET_EVENTS.TASK_FILE_ADDED,
        payload: { taskId, attachmentId: normalizeId(result.attachment._id) },
      });
      emitToOrganization({
        organizationId: normalizeId(result.task.organization),
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId },
      });
      emitToDepartment({
        departmentId: normalizeId(result.task.department),
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId },
      });
      emitToTask({
        taskId,
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId },
      });
    }

    emitNotificationEvents(result.notificationRecipients, {
      entityModel: "Task",
      entityId: taskId,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Attachment created",
      data: {
        attachment: toAttachmentSummary(result.attachment),
        taskId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/attachments/:attachmentId
 */
export const deleteAttachment = asyncHandler(async (req, res, next) => {
  try {
    const attachmentId = req.validated.params.attachmentId;
    const actorId = normalizeId(req.user.id);

    const result = await withMongoTransaction(async (session) => {
      const attachment = await Attachment.findById(attachmentId)
        .withDeleted()
        .session(session);
      if (!attachment) {
        throw new NotFoundError("Attachment not found");
      }

      if (attachment.isDeleted) {
        return {
          alreadyDeleted: true,
          attachment,
          taskId: null,
          organizationId: normalizeId(attachment.organization),
          departmentId: normalizeId(attachment.department),
        };
      }

      await attachment.softDelete(actorId, session);

      const taskId = await resolveTaskIdForParent({
        parentModel: attachment.parentModel,
        parentId: attachment.parent,
        session,
      });

      return {
        alreadyDeleted: false,
        attachment,
        taskId,
        organizationId: normalizeId(attachment.organization),
        departmentId: normalizeId(attachment.department),
      };
    });

    if (!result.alreadyDeleted && result.taskId) {
      emitToOrganization({
        organizationId: result.organizationId,
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId: normalizeId(result.taskId) },
      });
      emitToDepartment({
        departmentId: result.departmentId,
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId: normalizeId(result.taskId) },
      });
      emitToTask({
        taskId: normalizeId(result.taskId),
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId: normalizeId(result.taskId) },
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.alreadyDeleted
        ? "Attachment already deleted"
        : "Attachment deleted",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/attachments/:attachmentId/restore
 */
export const restoreAttachment = asyncHandler(async (req, res, next) => {
  try {
    const attachmentId = req.validated.params.attachmentId;

    const result = await withMongoTransaction(async (session) => {
      const attachment = await Attachment.findById(attachmentId)
        .withDeleted()
        .session(session);
      if (!attachment) {
        throw new NotFoundError("Attachment not found");
      }

      if (!attachment.isDeleted) {
        const populated = await Attachment.findById(attachment._id)
          .withDeleted()
          .populate("uploadedBy", "firstName lastName profilePicture")
          .session(session);

        return {
          alreadyActive: true,
          attachment: populated,
          taskId: null,
          organizationId: normalizeId(attachment.organization),
          departmentId: normalizeId(attachment.department),
        };
      }

      const parent = await loadAttachmentParent({
        parentModel: attachment.parentModel,
        parentId: attachment.parent,
        session,
      });
      if (!parent) {
        throw new NotFoundError("Attachment parent not found");
      }
      if (parent.isDeleted) {
        throw new ConflictError(
          "Cannot restore attachment when parent is deleted. Restore it first."
        );
      }

      await attachment.restore(session);

      const taskId = await resolveTaskIdForParent({
        parentModel: attachment.parentModel,
        parentId: attachment.parent,
        session,
      });

      const populated = await Attachment.findById(attachment._id)
        .withDeleted()
        .populate("uploadedBy", "firstName lastName profilePicture")
        .session(session);

      return {
        alreadyActive: false,
        attachment: populated,
        taskId,
        organizationId: normalizeId(attachment.organization),
        departmentId: normalizeId(attachment.department),
      };
    });

    if (result.taskId) {
      emitToOrganization({
        organizationId: result.organizationId,
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId: normalizeId(result.taskId) },
      });
      emitToDepartment({
        departmentId: result.departmentId,
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId: normalizeId(result.taskId) },
      });
      emitToTask({
        taskId: normalizeId(result.taskId),
        event: SOCKET_EVENTS.TASK_UPDATED,
        payload: { taskId: normalizeId(result.taskId) },
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.alreadyActive
        ? "Attachment is already active"
        : "Attachment restored",
      data: {
        attachment: toAttachmentSummary(result.attachment),
        taskId: normalizeId(result.taskId),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default {
  createAttachment,
  deleteAttachment,
  restoreAttachment,
};
