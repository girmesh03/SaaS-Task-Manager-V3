/**
 * @file Vendor model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";
import {
  EMAIL_REGEX,
  PHONE_REGEX,
  SOFT_DELETE_TTL_SECONDS,
  VALIDATION_LIMITS,
  VENDOR_STATUS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const isHalfStep = (value) => {
  if (value === null || value === undefined) {
    return true;
  }

  return (
    Math.round(value / VALIDATION_LIMITS.VENDOR.RATING_STEP) *
      VALIDATION_LIMITS.VENDOR.RATING_STEP ===
    value
  );
};

const vendorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      minlength: [VALIDATION_LIMITS.VENDOR.NAME_MIN, "Vendor name must be at least 2 characters"],
      maxlength: [VALIDATION_LIMITS.VENDOR.NAME_MAX, "Vendor name cannot exceed 200 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Vendor email is required"],
      trim: true,
      lowercase: true,
      maxlength: [VALIDATION_LIMITS.VENDOR.EMAIL_MAX, "Vendor email cannot exceed 100 characters"],
      match: [EMAIL_REGEX, "Vendor email format is invalid"],
    },
    phone: {
      type: String,
      required: [true, "Vendor phone is required"],
      trim: true,
      minlength: [VALIDATION_LIMITS.VENDOR.PHONE_MIN, "Vendor phone must be at least 10 characters"],
      maxlength: [VALIDATION_LIMITS.VENDOR.PHONE_MAX, "Vendor phone cannot exceed 15 characters"],
      match: [PHONE_REGEX, "Vendor phone format is invalid"],
    },
    website: {
      type: String,
      trim: true,
      maxlength: [VALIDATION_LIMITS.VENDOR.WEBSITE_MAX, "Vendor website cannot exceed 255 characters"],
      validate: {
        validator: (value) => !value || validator.isURL(value),
        message: "Vendor website must be a valid URL",
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [VALIDATION_LIMITS.VENDOR.LOCATION_MAX, "Vendor location cannot exceed 200 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [VALIDATION_LIMITS.VENDOR.ADDRESS_MAX, "Vendor address cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(VENDOR_STATUS),
        message: "Vendor status is invalid",
      },
      default: VENDOR_STATUS.ACTIVE,
      index: true,
    },
    isVerifiedPartner: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      min: [VALIDATION_LIMITS.VENDOR.RATING_MIN, "Vendor rating cannot be below 1"],
      max: [VALIDATION_LIMITS.VENDOR.RATING_MAX, "Vendor rating cannot exceed 5"],
      default: null,
      validate: {
        validator: isHalfStep,
        message: "Vendor rating must use 0.5 increments",
      },
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [VALIDATION_LIMITS.VENDOR.DESCRIPTION_MAX, "Vendor description cannot exceed 1000 characters"],
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.VENDOR,
});
vendorSchema.plugin(mongoosePaginate);

vendorSchema.index(
  { organization: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
vendorSchema.index(
  { organization: 1, email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
vendorSchema.index({ organization: 1, phone: 1 }, { unique: true });
vendorSchema.index({ organization: 1, status: 1 });
vendorSchema.index({ organization: 1, rating: 1 });

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default Vendor;
