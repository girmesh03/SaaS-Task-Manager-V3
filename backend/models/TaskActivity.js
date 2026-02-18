/**
 * @file TaskActivity model.
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

const activityMaterialSchema = new Schema(
  {
    material: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material reference is required when adding materials"],
    },
    quantity: {
      type: Number,
      required: [true, "Material quantity is required when adding materials"],
      min: [VALIDATION_LIMITS.MATERIAL.UNIT_MIN, "Material quantity must be greater than 0"],
    },
  },
  {
    _id: false,
  }
);

const taskActivitySchema = new Schema(
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
    activity: {
      type: String,
      required: [true, "Activity description is required"],
      minlength: [VALIDATION_LIMITS.TASK_ACTIVITY.ACTIVITY_MIN, "Activity must be at least 2 characters"],
      maxlength: [VALIDATION_LIMITS.TASK_ACTIVITY.ACTIVITY_MAX, "Activity cannot exceed 1000 characters"],
      trim: true,
    },
    materials: {
      type: [activityMaterialSchema],
      default: [],
      validate: [
        {
          validator: (value) =>
            Array.isArray(value) && value.length <= VALIDATION_LIMITS.TASK_ACTIVITY.MATERIALS_MAX,
          message: "Activity materials cannot exceed 20 entries",
        },
        {
          validator: (value) => {
            if (!Array.isArray(value)) {
              return false;
            }

            const ids = value.map((item) => item.material.toString());
            return new Set(ids).size === ids.length;
          },
          message: "Activity materials must be unique",
        },
      ],
    },
    attachments: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Attachment",
        },
      ],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length <= VALIDATION_LIMITS.TASK_ACTIVITY.ATTACHMENTS_MAX,
        message: "Activity attachments cannot exceed 20 entries",
      },
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

taskActivitySchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.TASK_ACTIVITY,
});
taskActivitySchema.plugin(mongoosePaginate);

taskActivitySchema.index({ parent: 1, parentModel: 1 });
taskActivitySchema.index({ organization: 1, department: 1 });
taskActivitySchema.index({ createdBy: 1 });

const TaskActivity =
  mongoose.models.TaskActivity || mongoose.model("TaskActivity", taskActivitySchema);

export default TaskActivity;
