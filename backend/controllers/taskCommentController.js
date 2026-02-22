/**
 * @file Task comment controllers (Phase 4).
 */
import asyncHandler from "express-async-handler";
import {
  Attachment,
  Notification,
  Task,
  TaskActivity,
  TaskComment,
  User,
} from "../models/index.js";
import { HTTP_STATUS, SOCKET_EVENTS, USER_STATUS } from "../utils/constants.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import {
  normalizeEmailLocalPart,
  normalizeId,
  parsePagination,
  withMongoTransaction,
} from "../utils/helpers.js";
import {
  buildPaginationMeta,
  extractMentionTokens,
} from "../utils/taskHelpers.js";
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
  uploadedBy: toUserSummary(attachment?.uploadedBy),
  createdAt: attachment?.createdAt || null,
  isDeleted: Boolean(attachment?.isDeleted),
});

const resolveTaskIdForComment = async ({ commentId, session }) => {
  let cursor = await TaskComment.findById(commentId)
    .withDeleted()
    .select("parent parentModel")
    .session(session);

  for (let i = 0; i < 6 && cursor; i += 1) {
    if (cursor.parentModel === "Task") {
      return normalizeId(cursor.parent);
    }

    if (cursor.parentModel === "TaskActivity") {
      const activity = await TaskActivity.findById(cursor.parent)
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

    if (cursor.parentModel !== "TaskComment") {
      return null;
    }

    cursor = await TaskComment.findById(cursor.parent)
      .withDeleted()
      .select("parent parentModel")
      .session(session);
  }

  return null;
};

const resolveMentionUsers = async ({ tokens = [], organizationId, departmentId, session }) => {
  const normalizedTokens = Array.from(
    new Set(
      (Array.isArray(tokens) ? tokens : [])
        .map((token) => normalizeEmailLocalPart(token))
        .filter(Boolean)
    )
  ).slice(0, 20);

  if (normalizedTokens.length === 0) {
    return [];
  }

  const candidates = await User.find({
    organization: organizationId,
    department: departmentId,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
    isDeleted: false,
  })
    .select("email firstName lastName profilePicture")
    .session(session);

  const byLocalPart = new Map();
  candidates.forEach((candidate) => {
    const email = String(candidate.email || "").trim().toLowerCase();
    const localPart = email.includes("@") ? email.split("@")[0] : email;
    const normalizedLocalPart = normalizeEmailLocalPart(localPart);
    if (!normalizedLocalPart) {
      return;
    }

    const existing = byLocalPart.get(normalizedLocalPart) || [];
    byLocalPart.set(normalizedLocalPart, [...existing, candidate]);
  });

  const resolved = [];
  normalizedTokens.forEach((token) => {
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
  entityModel = "TaskComment",
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
 * GET /api/tasks/:taskId/comments
 */
export const listTaskComments = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const query = req.validated.query;
    const pagination = parsePagination(query);

    const parentModel = query.parentModel || "Task";
    const parentId = query.parentId || taskId;

    if (parentModel === "Task" && normalizeId(parentId) !== normalizeId(taskId)) {
      throw new ValidationError("parentId must match taskId when parentModel is Task");
    }

    if (parentModel === "TaskActivity") {
      const activity = await TaskActivity.findById(parentId).withDeleted().select("parent parentModel isDeleted");
      if (!activity) {
        throw new NotFoundError("Task activity not found");
      }
      if (activity.parentModel !== "Task" || normalizeId(activity.parent) !== normalizeId(taskId)) {
        throw new ValidationError("parentId must belong to the requested task");
      }
    }

    if (parentModel === "TaskComment") {
      const resolved = await resolveTaskIdForComment({ commentId: parentId, session: null });
      if (!resolved) {
        throw new NotFoundError("Task comment not found");
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

    const paginationResult = await TaskComment.paginate(filter, {
      ...pagination.paginateOptions,
      populate: [
        { path: "createdBy", select: "firstName lastName profilePicture" },
        { path: "mentions", select: "firstName lastName profilePicture email" },
      ],
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    const comments = paginationResult.docs || [];
    const commentIds = comments.map((comment) => comment._id);

    const attachmentQuery = Attachment.find({
      parentModel: "TaskComment",
      parent: { $in: commentIds },
      organization: task.organization,
      department: task.department,
    })
      .sort({ createdAt: -1 })
      .select("filename fileUrl fileType fileSize parent uploadedBy createdAt isDeleted")
      .populate("uploadedBy", "firstName lastName profilePicture");

    if (pagination.includeDeleted) {
      attachmentQuery.withDeleted();
    }

    const attachments = commentIds.length ? await attachmentQuery.exec() : [];
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
        comments: comments.map((comment) => ({
          id: normalizeId(comment._id),
          parentModel: comment.parentModel,
          parent: normalizeId(comment.parent),
          comment: comment.comment,
          depth: Number(comment.depth || 0),
          mentions: Array.isArray(comment.mentions)
            ? comment.mentions.map((user) => toUserSummary(user))
            : [],
          attachments: (attachmentsByParent.get(normalizeId(comment._id)) || []).map(
            toAttachmentSummary
          ),
          createdBy: toUserSummary(comment.createdBy),
          createdAt: comment.createdAt || null,
          updatedAt: comment.updatedAt || null,
          isDeleted: Boolean(comment.isDeleted),
        })),
        pagination: buildPaginationMeta(paginationResult),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tasks/:taskId/comments
 */
export const createTaskComment = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const taskId = req.validated.params.taskId;
    const actorId = normalizeId(req.user.id);

    const parentModel = body.parentModel || "Task";
    const parentId = body.parentId || taskId;

    const result = await withMongoTransaction(async (session) => {
      const task = await Task.findById(taskId)
        .withDeleted()
        .select("title organization department watchers assignees isDeleted")
        .session(session);

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      if (task.isDeleted) {
        throw new ConflictError("Cannot add comments to a deleted task. Restore it first.");
      }

      let depth = 0;

      if (parentModel === "Task") {
        if (normalizeId(parentId) !== normalizeId(taskId)) {
          throw new ValidationError("parentId must match taskId when parentModel is Task");
        }
      } else if (parentModel === "TaskActivity") {
        const activity = await TaskActivity.findById(parentId)
          .withDeleted()
          .select("parent parentModel isDeleted")
          .session(session);
        if (!activity) {
          throw new NotFoundError("Task activity not found");
        }
        if (activity.isDeleted) {
          throw new ConflictError("Cannot comment on a deleted task activity.");
        }
        if (activity.parentModel !== "Task" || normalizeId(activity.parent) !== normalizeId(taskId)) {
          throw new ValidationError("parentId must belong to the requested task");
        }
        depth = 0;
      } else if (parentModel === "TaskComment") {
        const parentComment = await TaskComment.findById(parentId)
          .withDeleted()
          .select("parent parentModel depth isDeleted")
          .session(session);
        if (!parentComment) {
          throw new NotFoundError("Task comment not found");
        }
        if (parentComment.isDeleted) {
          throw new ConflictError("Cannot reply to a deleted comment.");
        }

        const resolvedTaskId = await resolveTaskIdForComment({ commentId: parentComment._id, session });
        if (!resolvedTaskId || normalizeId(resolvedTaskId) !== normalizeId(taskId)) {
          throw new ValidationError("parentId must belong to the requested task");
        }

        depth = Number(parentComment.depth || 0) + 1;
        if (depth > 5) {
          throw new ValidationError("Comment depth cannot exceed 5");
        }
      } else {
        throw new ValidationError("parentModel is invalid");
      }

      const mentionTokens = extractMentionTokens(body.comment);
      const mentionUsers = await resolveMentionUsers({
        tokens: mentionTokens,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
      });
      const mentionIds = mentionUsers.map((user) => normalizeId(user._id)).filter(Boolean);

      const created = await TaskComment.create(
        [
          {
            parent: parentId,
            parentModel,
            comment: body.comment,
            mentions: mentionIds,
            depth,
            organization: task.organization,
            department: task.department,
            createdBy: actorId,
          },
        ],
        { session }
      );
      const comment = Array.isArray(created) ? created[0] : created;

      const baseRecipients = [
        ...(Array.isArray(task.watchers) ? task.watchers : []),
        ...(Array.isArray(task.assignees) ? task.assignees : []),
      ]
        .map((id) => normalizeId(id))
        .filter((id) => id && id !== actorId);

      const mentionRecipientIds = mentionIds.filter((id) => id && id !== actorId);
      const genericRecipients = baseRecipients.filter(
        (id) => !mentionRecipientIds.includes(id)
      );

      const notifiedMentionIds = await createNotificationsForUsers({
        recipients: mentionRecipientIds,
        title: "Mentioned in a comment",
        message: `You were mentioned in a comment on: ${task.title}.`,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        entityModel: "TaskComment",
        entity: comment._id,
        session,
      });

      const notifiedGenericIds = await createNotificationsForUsers({
        recipients: genericRecipients,
        title: "New comment",
        message: `A new comment was added to: ${task.title}.`,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        entityModel: "TaskComment",
        entity: comment._id,
        session,
      });

      const populated = await TaskComment.findById(comment._id)
        .withDeleted()
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("mentions", "firstName lastName profilePicture email")
        .session(session);

      return {
        task,
        comment: populated,
        notificationRecipients: Array.from(
          new Set([...notifiedMentionIds, ...notifiedGenericIds])
        ),
        notifiedMentions: notifiedMentionIds,
      };
    });

    const resolvedTaskId = normalizeId(result.task._id);
    emitToTask({
      taskId: resolvedTaskId,
      event: SOCKET_EVENTS.TASK_COMMENT_ADDED,
      payload: { taskId: resolvedTaskId, commentId: normalizeId(result.comment._id) },
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
      entityModel: "TaskComment",
      entityId: normalizeId(result.comment._id),
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Task comment created",
      data: {
        comment: {
          id: normalizeId(result.comment._id),
          parentModel: result.comment.parentModel,
          parent: normalizeId(result.comment.parent),
          comment: result.comment.comment,
          depth: Number(result.comment.depth || 0),
          mentions: Array.isArray(result.comment.mentions)
            ? result.comment.mentions.map((user) => toUserSummary(user))
            : [],
          createdBy: toUserSummary(result.comment.createdBy),
          createdAt: result.comment.createdAt || null,
          updatedAt: result.comment.updatedAt || null,
          isDeleted: Boolean(result.comment.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:taskId/comments/:commentId
 */
export const getTaskComment = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const commentId = req.validated.params.commentId;

    const comment = await TaskComment.findById(commentId)
      .withDeleted()
      .populate("createdBy", "firstName lastName profilePicture")
      .populate("mentions", "firstName lastName profilePicture email");

    if (!comment) {
      throw new NotFoundError("Task comment not found");
    }

    const resolvedTaskId = await resolveTaskIdForComment({
      commentId,
      session: null,
    });
    if (!resolvedTaskId || normalizeId(resolvedTaskId) !== normalizeId(taskId)) {
      throw new NotFoundError("Task comment not found");
    }

    const attachments = await Attachment.find({
      parentModel: "TaskComment",
      parent: comment._id,
    })
      .withDeleted()
      .sort({ createdAt: -1 })
      .select("filename fileUrl fileType fileSize uploadedBy createdAt isDeleted")
      .populate("uploadedBy", "firstName lastName profilePicture");

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        comment: {
          id: normalizeId(comment._id),
          parentModel: comment.parentModel,
          parent: normalizeId(comment.parent),
          comment: comment.comment,
          depth: Number(comment.depth || 0),
          mentions: Array.isArray(comment.mentions)
            ? comment.mentions.map((user) => toUserSummary(user))
            : [],
          attachments: attachments.map(toAttachmentSummary),
          createdBy: toUserSummary(comment.createdBy),
          createdAt: comment.createdAt || null,
          updatedAt: comment.updatedAt || null,
          isDeleted: Boolean(comment.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId/comments/:commentId
 */
export const updateTaskComment = asyncHandler(async (req, res, next) => {
  const body = req.validated.body;

  try {
    const taskId = req.validated.params.taskId;
    const commentId = req.validated.params.commentId;
    const actorId = normalizeId(req.user.id);

    const result = await withMongoTransaction(async (session) => {
      const comment = await TaskComment.findById(commentId)
        .withDeleted()
        .session(session);
      if (!comment) {
        throw new NotFoundError("Task comment not found");
      }

      const resolvedTaskId = await resolveTaskIdForComment({
        commentId,
        session,
      });
      if (!resolvedTaskId || normalizeId(resolvedTaskId) !== normalizeId(taskId)) {
        throw new NotFoundError("Task comment not found");
      }

      if (comment.isDeleted) {
        throw new ConflictError("Cannot update a deleted comment. Restore it first.");
      }

      const task = await Task.findById(taskId)
        .withDeleted()
        .select("title organization department isDeleted")
        .session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }
      if (task.isDeleted) {
        throw new ConflictError("Cannot update comments for a deleted task.");
      }

      const previousMentionIds = Array.isArray(comment.mentions)
        ? comment.mentions.map((id) => normalizeId(id)).filter(Boolean)
        : [];

      comment.comment = body.comment;

      const mentionTokens = extractMentionTokens(body.comment);
      const mentionUsers = await resolveMentionUsers({
        tokens: mentionTokens,
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
      });

      const nextMentionIds = mentionUsers.map((user) => normalizeId(user._id)).filter(Boolean);
      comment.mentions = nextMentionIds;

      await comment.save({ session });

      const newlyAddedMentions = nextMentionIds.filter(
        (id) => !previousMentionIds.includes(id) && id !== actorId
      );

      const notifiedMentions = newlyAddedMentions.length
        ? await createNotificationsForUsers({
            recipients: newlyAddedMentions,
            title: "Mentioned in a comment",
            message: `You were mentioned in a comment on: ${task.title}.`,
            organizationId: normalizeId(task.organization),
            departmentId: normalizeId(task.department),
            entityModel: "TaskComment",
            entity: comment._id,
            session,
          })
        : [];

      const populated = await TaskComment.findById(comment._id)
        .withDeleted()
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("mentions", "firstName lastName profilePicture email")
        .session(session);

      return {
        task,
        comment: populated,
        notifiedMentions,
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

    emitNotificationEvents(result.notifiedMentions, {
      entityModel: "TaskComment",
      entityId: normalizeId(result.comment._id),
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task comment updated",
      data: {
        comment: {
          id: normalizeId(result.comment._id),
          parentModel: result.comment.parentModel,
          parent: normalizeId(result.comment.parent),
          comment: result.comment.comment,
          depth: Number(result.comment.depth || 0),
          mentions: Array.isArray(result.comment.mentions)
            ? result.comment.mentions.map((user) => toUserSummary(user))
            : [],
          createdBy: toUserSummary(result.comment.createdBy),
          createdAt: result.comment.createdAt || null,
          updatedAt: result.comment.updatedAt || null,
          isDeleted: Boolean(result.comment.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:taskId/comments/:commentId
 */
export const deleteTaskComment = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const commentId = req.validated.params.commentId;
    const actorId = normalizeId(req.user.id);

    const result = await withMongoTransaction(async (session) => {
      const comment = await TaskComment.findById(commentId)
        .withDeleted()
        .session(session);
      if (!comment) {
        throw new NotFoundError("Task comment not found");
      }

      const resolvedTaskId = await resolveTaskIdForComment({
        commentId,
        session,
      });
      if (!resolvedTaskId || normalizeId(resolvedTaskId) !== normalizeId(taskId)) {
        throw new NotFoundError("Task comment not found");
      }

      const task = await Task.findById(taskId)
        .withDeleted()
        .select("organization department isDeleted")
        .session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }
      if (task.isDeleted) {
        throw new ConflictError("Cannot delete comments for a deleted task.");
      }

      if (comment.isDeleted) {
        return {
          alreadyDeleted: true,
          task,
        };
      }

      const deletedAt = new Date();

      await comment.softDelete(actorId, session);

      await Attachment.updateMany(
        {
          parentModel: "TaskComment",
          parent: comment._id,
          organization: task.organization,
          department: task.department,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await Notification.updateMany(
        {
          entityModel: "TaskComment",
          entity: comment._id,
          organization: task.organization,
          department: task.department,
          isDeleted: false,
        },
        { $set: { isDeleted: true, deletedAt, deletedBy: actorId } },
        { session }
      );

      await cascadeDeleteComments({
        seedIds: [comment._id],
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        actorId,
        deletedAt,
        session,
      });

      return {
        alreadyDeleted: false,
        task,
      };
    });

    if (result.alreadyDeleted) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Task comment already deleted",
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
      message: "Task comment deleted",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/tasks/:taskId/comments/:commentId/restore
 */
export const restoreTaskComment = asyncHandler(async (req, res, next) => {
  try {
    const taskId = req.validated.params.taskId;
    const commentId = req.validated.params.commentId;

    const result = await withMongoTransaction(async (session) => {
      const comment = await TaskComment.findById(commentId)
        .withDeleted()
        .session(session);
      if (!comment) {
        throw new NotFoundError("Task comment not found");
      }

      const resolvedTaskId = await resolveTaskIdForComment({
        commentId,
        session,
      });
      if (!resolvedTaskId || normalizeId(resolvedTaskId) !== normalizeId(taskId)) {
        throw new NotFoundError("Task comment not found");
      }

      const task = await Task.findById(taskId)
        .withDeleted()
        .select("organization department isDeleted")
        .session(session);
      if (!task) {
        throw new NotFoundError("Task not found");
      }
      if (task.isDeleted) {
        throw new ConflictError("Cannot restore comments for a deleted task.");
      }

      if (!comment.isDeleted) {
        const populated = await TaskComment.findById(comment._id)
          .withDeleted()
          .populate("createdBy", "firstName lastName profilePicture")
          .populate("mentions", "firstName lastName profilePicture email")
          .session(session);

        return {
          alreadyActive: true,
          task,
          comment: populated,
        };
      }

      if (comment.parentModel === "TaskActivity") {
        const activity = await TaskActivity.findById(comment.parent)
          .withDeleted()
          .select("isDeleted parent parentModel")
          .session(session);
        if (!activity) {
          throw new NotFoundError("Task activity not found");
        }
        if (activity.isDeleted) {
          throw new ConflictError("Cannot restore comment when parent activity is deleted.");
        }
      }

      if (comment.parentModel === "TaskComment") {
        const parentComment = await TaskComment.findById(comment.parent)
          .withDeleted()
          .select("isDeleted")
          .session(session);
        if (!parentComment) {
          throw new NotFoundError("Task comment not found");
        }
        if (parentComment.isDeleted) {
          throw new ConflictError("Cannot restore comment when parent comment is deleted.");
        }
      }

      await comment.restore(session);

      await Attachment.updateMany(
        {
          parentModel: "TaskComment",
          parent: comment._id,
          organization: task.organization,
          department: task.department,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await Notification.updateMany(
        {
          entityModel: "TaskComment",
          entity: comment._id,
          organization: task.organization,
          department: task.department,
          isDeleted: true,
        },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
        { session }
      );

      await cascadeRestoreComments({
        seedIds: [comment._id],
        organizationId: normalizeId(task.organization),
        departmentId: normalizeId(task.department),
        session,
      });

      const populated = await TaskComment.findById(comment._id)
        .withDeleted()
        .populate("createdBy", "firstName lastName profilePicture")
        .populate("mentions", "firstName lastName profilePicture email")
        .session(session);

      return {
        alreadyActive: false,
        task,
        comment: populated,
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
        message: "Task comment is already active",
        data: {
          comment: {
            id: normalizeId(result.comment._id),
            parentModel: result.comment.parentModel,
            parent: normalizeId(result.comment.parent),
            comment: result.comment.comment,
            depth: Number(result.comment.depth || 0),
            mentions: Array.isArray(result.comment.mentions)
              ? result.comment.mentions.map((user) => toUserSummary(user))
              : [],
            createdBy: toUserSummary(result.comment.createdBy),
            createdAt: result.comment.createdAt || null,
            updatedAt: result.comment.updatedAt || null,
            isDeleted: Boolean(result.comment.isDeleted),
          },
        },
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Task comment restored",
      data: {
        comment: {
          id: normalizeId(result.comment._id),
          parentModel: result.comment.parentModel,
          parent: normalizeId(result.comment.parent),
          comment: result.comment.comment,
          depth: Number(result.comment.depth || 0),
          mentions: Array.isArray(result.comment.mentions)
            ? result.comment.mentions.map((user) => toUserSummary(user))
            : [],
          createdBy: toUserSummary(result.comment.createdBy),
          createdAt: result.comment.createdAt || null,
          updatedAt: result.comment.updatedAt || null,
          isDeleted: Boolean(result.comment.isDeleted),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default {
  listTaskComments,
  createTaskComment,
  getTaskComment,
  updateTaskComment,
  deleteTaskComment,
  restoreTaskComment,
};

