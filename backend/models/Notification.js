/**
 * @file Notification model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  INDEX_DEFAULTS,
  NOTIFICATION_ENTITY_MODELS,
  NOTIFICATION_EXPIRY_MS,
  SOFT_DELETE_TTL_SECONDS,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const thirtyDaysFromNow = () => {
  return new Date(Date.now() + NOTIFICATION_EXPIRY_MS);
};

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [
        VALIDATION_LIMITS.NOTIFICATION.TITLE_MAX,
        "Notification title cannot exceed 200 characters",
      ],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      minlength: [
        VALIDATION_LIMITS.NOTIFICATION.MESSAGE_MIN,
        "Notification message must be at least 1 character",
      ],
      maxlength: [
        VALIDATION_LIMITS.NOTIFICATION.MESSAGE_MAX,
        "Notification message cannot exceed 500 characters",
      ],
    },
    entity: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    entityModel: {
      type: String,
      enum: {
        values: NOTIFICATION_ENTITY_MODELS,
        message: "Notification entity model is invalid",
      },
      default: null,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: thirtyDaysFromNow,
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
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification user is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.NOTIFICATION,
});
notificationSchema.plugin(mongoosePaginate);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ organization: 1, department: 1 });
notificationSchema.index({ entity: 1, entityModel: 1 });
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: INDEX_DEFAULTS.TTL_EXPIRE_AT_FIELD_SECONDS }
);

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
