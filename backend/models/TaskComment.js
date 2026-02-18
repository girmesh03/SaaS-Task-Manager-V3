/**
 * @file TaskComment model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  SOFT_DELETE_TTL_SECONDS,
  TASK_PARENT_MODELS,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const taskCommentSchema = new Schema(
  {
    parent: {
      type: Schema.Types.ObjectId,
      required: [true, "Parent reference is required"],
      index: true,
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: TASK_PARENT_MODELS,
        message: "Parent model is invalid",
      },
      index: true,
    },
    comment: {
      type: String,
      required: [true, "Comment content is required"],
      minlength: [VALIDATION_LIMITS.TASK_COMMENT.COMMENT_MIN, "Comment must be at least 2 characters"],
      maxlength: [VALIDATION_LIMITS.TASK_COMMENT.COMMENT_MAX, "Comment cannot exceed 2000 characters"],
      trim: true,
    },
    mentions: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length <= VALIDATION_LIMITS.TASK_COMMENT.MENTIONS_MAX,
        message: "Comment mentions cannot exceed 20 users",
      },
    },
    depth: {
      type: Number,
      default: 0,
      min: [VALIDATION_LIMITS.TASK_COMMENT.DEPTH_MIN, "Comment depth cannot be below 0"],
      max: [VALIDATION_LIMITS.TASK_COMMENT.DEPTH_MAX, "Comment depth cannot exceed 5"],
    },
    attachments: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Attachment",
        },
      ],
      default: [],
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },
  },
  {
    timestamps: true,
  }
);

taskCommentSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.TASK_COMMENT,
});
taskCommentSchema.plugin(mongoosePaginate);

taskCommentSchema.index({ parent: 1, parentModel: 1 });
taskCommentSchema.index({ organization: 1, department: 1 });
taskCommentSchema.index({ createdBy: 1 });
taskCommentSchema.index({ mentions: 1 });

const TaskComment =
  mongoose.models.TaskComment || mongoose.model("TaskComment", taskCommentSchema);

export default TaskComment;
