/**
 * @file Organization controllers.
 */
import asyncHandler from "express-async-handler";
import { Organization } from "../models/index.js";
import { HTTP_STATUS, USER_ROLES } from "../utils/constants.js";
import { parsePagination } from "../utils/helpers.js";
import { createPlaceholderController } from "./controllerPlaceholders.js";

const normalizeId = (value) =>
  !value
    ? null
    : typeof value === "object" && typeof value.toString === "function"
      ? value.toString()
      : String(value);

const toBoolean = (value) => String(value || "").toLowerCase() === "true";

const isPlatformSuperAdmin = (user) =>
  user?.role === USER_ROLES.SUPER_ADMIN && Boolean(user?.isPlatformOrgUser);

const buildPaginationMeta = (result, fallback) => ({
  totalDocs: result.totalDocs || 0,
  totalItems: result.totalDocs || 0,
  limit: result.limit || fallback.limit,
  page: result.page || fallback.page,
  totalPages: result.totalPages || 1,
  hasNextPage: Boolean(result.hasNextPage),
  hasPrevPage: Boolean(result.hasPrevPage),
});

const toOrganizationSummary = (organization) => ({
  id: normalizeId(organization._id),
  name: organization.name || "",
  email: organization.email || "",
  phone: organization.phone || "",
  industry: organization.industry || "",
  size: organization.size || "",
  isPlatformOrg: Boolean(organization.isPlatformOrg),
  isVerified: Boolean(organization.isVerified),
  createdAt: organization.createdAt || null,
  updatedAt: organization.updatedAt || null,
  isDeleted: Boolean(organization.isDeleted),
});

/**
 * GET /api/organizations
 */
export const listOrganizations = asyncHandler(async (req, res, next) => {
  const query = req.validated.query;

  try {
    const pagination = parsePagination(query);
    const filter = {};

    if (!isPlatformSuperAdmin(req.user)) {
      filter._id = normalizeId(req.user.organization);
    }

    if (query.isPlatformOrg !== undefined) {
      filter.isPlatformOrg = toBoolean(query.isPlatformOrg);
    }
    if (query.isVerified !== undefined) {
      filter.isVerified = toBoolean(query.isVerified);
    }

    const paginationResult = await Organization.paginate(filter, {
      ...pagination.paginateOptions,
      customFind: pagination.includeDeleted ? "findWithDeleted" : "find",
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        organizations: (paginationResult.docs || []).map((record) =>
          toOrganizationSummary(record)
        ),
        pagination: buildPaginationMeta(paginationResult, pagination),
      },
    });
  } catch (error) {
    next(error);
  }
});

export const createOrganization = createPlaceholderController("Organization", "createOrganization");
export const getOrganization = createPlaceholderController("Organization", "getOrganization");
export const updateOrganization = createPlaceholderController("Organization", "updateOrganization");
export const deleteOrganization = createPlaceholderController("Organization", "deleteOrganization");
export const restoreOrganization = createPlaceholderController("Organization", "restoreOrganization");

export default {
  listOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  restoreOrganization,
};
