/**
 * @file Material model.
 */
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_STATUS,
  SOFT_DELETE_TTL_SECONDS,
  SKU_REGEX,
  VALIDATION_LIMITS,
} from "../utils/constants.js";
import softDeletePlugin from "./plugins/softDelete.js";

const { Schema } = mongoose;

const inventorySchema = new Schema(
  {
    stockOnHand: {
      type: Number,
      min: [VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN, "Stock on hand cannot be below 0"],
      default: 0,
      required: true,
    },
    lowStockThreshold: {
      type: Number,
      min: [VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN, "Low stock threshold cannot be below 0"],
      default: 0,
      required: true,
    },
    reorderQuantity: {
      type: Number,
      min: [VALIDATION_LIMITS.MATERIAL.INVENTORY_MIN, "Reorder quantity cannot be below 0"],
      default: 0,
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const materialSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
      minlength: [VALIDATION_LIMITS.MATERIAL.NAME_MIN, "Material name must be at least 2 characters"],
      maxlength: [VALIDATION_LIMITS.MATERIAL.NAME_MAX, "Material name cannot exceed 200 characters"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      minlength: [VALIDATION_LIMITS.MATERIAL.SKU_MIN, "SKU must be at least 2 characters"],
      maxlength: [VALIDATION_LIMITS.MATERIAL.SKU_MAX, "SKU cannot exceed 30 characters"],
      trim: true,
      uppercase: true,
      match: [SKU_REGEX, "SKU format is invalid"],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(MATERIAL_STATUS),
        message: "Material status is invalid",
      },
      default: MATERIAL_STATUS.ACTIVE,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [VALIDATION_LIMITS.MATERIAL.DESCRIPTION_MAX, "Material description cannot exceed 1000 characters"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      minlength: [VALIDATION_LIMITS.MATERIAL.UNIT_MIN, "Unit must be at least 1 character"],
      maxlength: [VALIDATION_LIMITS.MATERIAL.UNIT_MAX, "Unit cannot exceed 50 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: MATERIAL_CATEGORIES,
        message: "Material category is invalid",
      },
      default: "Other",
    },
    price: {
      type: Number,
      min: [VALIDATION_LIMITS.MATERIAL.PRICE_MIN, "Material unit price cannot be below 0"],
      default: 0,
    },
    inventory: {
      type: inventorySchema,
      default: () => ({}),
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
  }
);

materialSchema.plugin(softDeletePlugin, {
  deletedTtlSeconds: SOFT_DELETE_TTL_SECONDS.MATERIAL,
});
materialSchema.plugin(mongoosePaginate);

materialSchema.index(
  { organization: 1, department: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
materialSchema.index({ organization: 1, department: 1, sku: 1 }, { unique: true });
materialSchema.index({ organization: 1, department: 1, status: 1 });

materialSchema.pre("validate", function normalizeSku() {
  if (!this.sku) {
    return;
  }

  this.sku = String(this.sku).trim().toUpperCase();
});

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);

export default Material;
