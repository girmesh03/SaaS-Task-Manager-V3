/**
 * @file Material controllers (Phase 4 list endpoint).
 */
import asyncHandler from "express-async-handler";
import Material from "../models/Material.js";
import {
  HTTP_STATUS,
  MATERIAL_STATUS,
} from "../utils/constants.js";
import { ValidationError } from "../utils/errors.js";
import { normalizeId, parsePagination } from "../utils/helpers.js";
import {
  buildDateRangeFilter,
  buildPaginationMeta,
  ensureOrgScopeQuery,
  isPlatformSuperAdmin,
  parseCsv,
} from "../utils/taskHelpers.js";
import { createPlaceholderController } from "./controllerPlaceholders.js";

/**
 * GET /api/materials
 */
export const listMaterials = asyncHandler(async (req, res, next) => {
  try {
    const query = req.validated.query;
    const pagination = parsePagination(query);
    const organizationId = ensureOrgScopeQuery(req.user, query.organizationId);

    const filter = {
      organization: organizationId,
    };

    if (isPlatformSuperAdmin(req.user)) {
      if (query.departmentId) {
        filter.department = query.departmentId;
      }
    } else {
      filter.department = normalizeId(req.user.department);
    }

    const statusFilter = parseCsv(query.status);
    filter.status = statusFilter.length ? { $in: statusFilter } : MATERIAL_STATUS.ACTIVE;

    const categoryFilter = parseCsv(query.category);
    if (categoryFilter.length) {
      filter.category = { $in: categoryFilter };
    }

    if (query.sku) {
      filter.sku = String(query.sku).trim().toUpperCase();
    }

    if (query.lowStockOnly) {
      const normalized = String(query.lowStockOnly).trim().toLowerCase();
      const enabled = ["true", "1", "yes"].includes(normalized);
      if (enabled) {
        filter.$expr = { $lte: ["$inventory.stockOnHand", "$inventory.lowStockThreshold"] };
      }
    }

    const createdRange = buildDateRangeFilter(query.createdFrom, query.createdTo);
    if (createdRange) {
      filter.createdAt = createdRange;
    }

    const paginationResult = await Material.paginate(filter, {
      ...pagination.paginateOptions,
      select: "name sku unit price status inventory.stockOnHand department createdAt isDeleted",
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    const materials = paginationResult.docs || [];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        materials: materials.map((material) => ({
          id: normalizeId(material._id),
          name: material.name || "",
          sku: material.sku || "",
          unit: material.unit || "",
          price: Number(material.price || 0),
          status: material.status || "",
          stockOnHand: Number(material?.inventory?.stockOnHand ?? 0),
          department: normalizeId(material.department),
          createdAt: material.createdAt || null,
          isDeleted: Boolean(material.isDeleted),
        })),
        pagination: buildPaginationMeta(paginationResult),
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      next(error);
      return;
    }
    next(error);
  }
});
export const createMaterial = createPlaceholderController("Material", "createMaterial");
export const getMaterial = createPlaceholderController("Material", "getMaterial");
export const getMaterialUsage = createPlaceholderController("Material", "getMaterialUsage");
export const updateMaterial = createPlaceholderController("Material", "updateMaterial");
export const restockMaterial = createPlaceholderController("Material", "restockMaterial");
export const deleteMaterial = createPlaceholderController("Material", "deleteMaterial");
export const restoreMaterial = createPlaceholderController("Material", "restoreMaterial");

export default {
  listMaterials,
  createMaterial,
  getMaterial,
  getMaterialUsage,
  updateMaterial,
  restockMaterial,
  deleteMaterial,
  restoreMaterial,
};
