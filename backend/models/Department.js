/**
 * @file Department model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  DEPARTMENT_STATUS,
  ORGANIZATION_NAME_REGEX,
  SOFT_DELETE_TTL_SECONDS,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      minlength: [
        VALIDATION_LIMITS.DEPARTMENT.NAME_MIN,
        "Department name must be at least 2 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.DEPARTMENT.NAME_MAX,
        "Department name cannot exceed 100 characters",
      ],
      trim: true,
      match: [ORGANIZATION_NAME_REGEX, "Department name format is invalid"],
    },
    description: {
      type: String,
      required: [true, "Department description is required"],
      trim: true,
      maxlength: [
        VALIDATION_LIMITS.DEPARTMENT.DESCRIPTION_MAX,
        "Department description cannot exceed 500 characters",
      ],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DEPARTMENT_STATUS),
        message: "Department status is invalid",
      },
      default: DEPARTMENT_STATUS.ACTIVE,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
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

departmentSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.DEPARTMENT,
});
departmentSchema.plugin(mongoosePaginate);

departmentSchema.index(
  { organization: 1, name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);
departmentSchema.index({ organization: 1, status: 1 });
departmentSchema.index({ organization: 1, isDeleted: 1 });
departmentSchema.index({ manager: 1 });

departmentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

departmentSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

const Department =
  mongoose.models.Department || mongoose.model("Department", departmentSchema);

export default Department;
