/**
 * @file Attachment model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  ATTACHMENT_FILE_TYPES,
  CLOUDINARY_FILE_URL_REGEX,
  SOFT_DELETE_TTL_SECONDS,
  TASK_PARENT_MODELS,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    filename: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      minlength: [
        VALIDATION_LIMITS.ATTACHMENT.FILE_NAME_MIN,
        "File name must be at least 1 character",
      ],
      maxlength: [
        VALIDATION_LIMITS.ATTACHMENT.FILE_NAME_MAX,
        "File name cannot exceed 255 characters",
      ],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
      match: [CLOUDINARY_FILE_URL_REGEX, "File URL must be a valid Cloudinary resource URL"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
      enum: {
        values: ATTACHMENT_FILE_TYPES,
        message: "File type is invalid",
      },
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [VALIDATION_LIMITS.ATTACHMENT.FILE_SIZE_MIN, "File size cannot be below 0"],
      max: [
        VALIDATION_LIMITS.ATTACHMENT.FILE_SIZE_MAX_BYTES,
        "File size cannot exceed 10MB",
      ],
    },
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
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploaded by user is required"],
    },
  },
  {
    timestamps: true,
  }
);

attachmentSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.ATTACHMENT,
});
attachmentSchema.plugin(mongoosePaginate);

attachmentSchema.index({ parent: 1, parentModel: 1 });
attachmentSchema.index({ organization: 1, department: 1 });
attachmentSchema.index({ uploadedBy: 1 });

const Attachment =
  mongoose.models.Attachment || mongoose.model("Attachment", attachmentSchema);

export default Attachment;
