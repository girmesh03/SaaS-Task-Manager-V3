/**
 * @file Vendor controllers (Phase 4 list endpoint).
 */
import asyncHandler from "express-async-handler";
import Vendor from "../models/Vendor.js";
import { HTTP_STATUS, VENDOR_STATUS } from "../utils/constants.js";
import { normalizeId, parsePagination } from "../utils/helpers.js";
import {
  buildDateRangeFilter,
  buildPaginationMeta,
  ensureOrgScopeQuery,
  parseCsv,
} from "../utils/taskHelpers.js";
import { createPlaceholderController } from "./controllerPlaceholders.js";

/**
 * GET /api/vendors
 */
export const listVendors = asyncHandler(async (req, res, next) => {
  try {
    const query = req.validated.query;
    const pagination = parsePagination(query);
    const organizationId = ensureOrgScopeQuery(req.user, query.organizationId);

    const filter = {
      organization: organizationId,
    };

    const statusFilter = parseCsv(query.status);
    filter.status = statusFilter.length ? { $in: statusFilter } : VENDOR_STATUS.ACTIVE;

    if (query.ratingMin !== undefined) {
      filter.rating = filter.rating || {};
      filter.rating.$gte = Number(query.ratingMin);
    }
    if (query.ratingMax !== undefined) {
      filter.rating = filter.rating || {};
      filter.rating.$lte = Number(query.ratingMax);
    }

    if (query.verifiedPartner !== undefined) {
      const normalized = String(query.verifiedPartner).trim().toLowerCase();
      filter.isVerifiedPartner = ["true", "1", "yes"].includes(normalized);
    }

    const createdRange = buildDateRangeFilter(query.createdFrom, query.createdTo);
    if (createdRange) {
      filter.createdAt = createdRange;
    }

    const paginationResult = await Vendor.paginate(filter, {
      ...pagination.paginateOptions,
      select: "name status rating isVerifiedPartner createdAt isDeleted",
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    const vendors = paginationResult.docs || [];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        vendors: vendors.map((vendor) => ({
          id: normalizeId(vendor._id),
          name: vendor.name || "",
          status: vendor.status || "",
          rating: vendor.rating === null || vendor.rating === undefined ? null : Number(vendor.rating),
          isVerifiedPartner: Boolean(vendor.isVerifiedPartner),
          createdAt: vendor.createdAt || null,
          isDeleted: Boolean(vendor.isDeleted),
        })),
        pagination: buildPaginationMeta(paginationResult),
      },
    });
  } catch (error) {
    next(error);
  }
});
export const createVendor = createPlaceholderController("Vendor", "createVendor");
export const getVendor = createPlaceholderController("Vendor", "getVendor");
export const updateVendor = createPlaceholderController("Vendor", "updateVendor");
export const contactVendor = createPlaceholderController("Vendor", "contactVendor");
export const deleteVendor = createPlaceholderController("Vendor", "deleteVendor");
export const restoreVendor = createPlaceholderController("Vendor", "restoreVendor");

export default {
  listVendors,
  createVendor,
  getVendor,
  updateVendor,
  contactVendor,
  deleteVendor,
  restoreVendor,
};
