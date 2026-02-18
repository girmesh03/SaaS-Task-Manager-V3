/**
 * @file Organization controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listOrganizations = createPlaceholderController("Organization", "listOrganizations");
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
