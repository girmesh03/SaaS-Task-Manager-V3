/**
 * @file Organization model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  EMAIL_REGEX,
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_NAME_REGEX,
  ORGANIZATION_SIZES,
  PHONE_REGEX,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const organizationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      minlength: [
        VALIDATION_LIMITS.ORGANIZATION.NAME_MIN,
        "Organization name must be at least 2 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.ORGANIZATION.NAME_MAX,
        "Organization name cannot exceed 100 characters",
      ],
      trim: true,
      match: [ORGANIZATION_NAME_REGEX, "Organization name format is invalid"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION_LIMITS.ORGANIZATION.DESCRIPTION_MAX,
        "Organization description cannot exceed 1000 characters",
      ],
    },
    email: {
      type: String,
      required: [true, "Organization email is required"],
      lowercase: true,
      trim: true,
      maxlength: [
        VALIDATION_LIMITS.ORGANIZATION.EMAIL_MAX,
        "Organization email cannot exceed 100 characters",
      ],
      match: [EMAIL_REGEX, "Organization email format is invalid"],
    },
    phone: {
      type: String,
      required: [true, "Organization phone is required"],
      trim: true,
      minlength: [
        VALIDATION_LIMITS.ORGANIZATION.PHONE_MIN,
        "Organization phone must be at least 10 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.ORGANIZATION.PHONE_MAX,
        "Organization phone cannot exceed 15 characters",
      ],
      match: [PHONE_REGEX, "Organization phone format is invalid"],
    },
    address: {
      type: String,
      required: [true, "Organization address is required"],
      trim: true,
      minlength: [
        VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MIN,
        "Organization address must be at least 5 characters",
      ],
      maxlength: [
        VALIDATION_LIMITS.ORGANIZATION.ADDRESS_MAX,
        "Organization address cannot exceed 500 characters",
      ],
    },
    industry: {
      type: String,
      required: [true, "Industry is required"],
      enum: {
        values: ORGANIZATION_INDUSTRIES,
        message: "Industry is invalid",
      },
    },
    size: {
      type: String,
      required: [true, "Organization size is required"],
      enum: {
        values: ORGANIZATION_SIZES,
        message: "Organization size is invalid",
      },
    },
    logo: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
        maxlength: [
          VALIDATION_LIMITS.ORGANIZATION.LOGO_PUBLIC_ID_MAX,
          "Logo public id cannot exceed 255 characters",
        ],
      },
    },
    isPlatformOrg: {
      type: Boolean,
      default: false,
      immutable: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.plugin(softDeletePlugin);
organizationSchema.plugin(mongoosePaginate);

organizationSchema.index({ isPlatformOrg: 1 });
organizationSchema.index({ email: 1 }, { unique: true });

organizationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

organizationSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

const Organization =
  mongoose.models.Organization || mongoose.model("Organization", organizationSchema);

export default Organization;
