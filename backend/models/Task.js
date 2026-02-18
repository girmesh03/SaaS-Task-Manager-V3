/**
 * @file Base Task model with discriminator key.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  TASK_PARENT_MODELS,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPE,
  SOFT_DELETE_TTL_SECONDS,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const ensureUniqueStrings = (values = []) => {
  if (!Array.isArray(values)) {
    return false;
  }

  const normalized = values
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return new Set(normalized).size === normalized.length;
};

const ensureUniqueObjectIds = (values = []) => {
  if (!Array.isArray(values)) {
    return false;
  }

  const normalized = values
    .filter(Boolean)
    .map((value) => value.toString());

  return new Set(normalized).size === normalized.length;
};

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      minlength: [VALIDATION_LIMITS.TASK.TITLE_MIN, "Task title must be at least 3 characters"],
      maxlength: [VALIDATION_LIMITS.TASK.TITLE_MAX, "Task title cannot exceed 200 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      minlength: [
        VALIDATION_LIMITS.TASK.DESCRIPTION_MIN,
        "Task description must be at least 10 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.TASK.DESCRIPTION_MAX,
        "Task description cannot exceed 5000 characters",
      ],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TASK_STATUS),
        message: "Task status is invalid",
      },
      default: TASK_STATUS.TODO,
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(TASK_PRIORITY),
        message: "Task priority is invalid",
      },
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (tags) => Array.isArray(tags) && tags.length <= VALIDATION_LIMITS.TASK.TAGS_MAX,
          message: "Task tags cannot exceed 5 entries",
        },
        {
          validator: ensureUniqueStrings,
          message: "Task tags must be unique (case-insensitive)",
        },
        {
          validator: (tags) => {
            if (!Array.isArray(tags)) {
              return false;
            }

            return tags.every(
              (tag) => String(tag).trim().length <= VALIDATION_LIMITS.TASK.TAG_MAX_LENGTH
            );
          },
          message: "Each task tag must be 50 characters or less",
        },
      ],
    },
    watchers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
      validate: {
        validator: ensureUniqueObjectIds,
        message: "Task watchers must be unique",
      },
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
      index: true,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "type",
  }
);

taskSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.TASK,
});
taskSchema.plugin(mongoosePaginate);

taskSchema.index({ organization: 1, department: 1, status: 1 });
taskSchema.index({ organization: 1, department: 1, type: 1 });
taskSchema.index({ organization: 1, department: 1, priority: 1 });
taskSchema.index({ organization: 1, department: 1, createdBy: 1 });
taskSchema.index({ title: "text", description: "text" });

taskSchema.pre("validate", function normalizeTags() {
  if (!Array.isArray(this.tags)) {
    this.tags = [];
    return;
  }

  this.tags = this.tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

/**
 * Allowed parent model values for task-scoped polymorphic entities.
 *
 * @type {readonly string[]}
 */
export const TASK_PARENT_MODEL_VALUES = Object.freeze(TASK_PARENT_MODELS);

export default Task;
