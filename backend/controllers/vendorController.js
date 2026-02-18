/**
 * @file Vendor controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listVendors = createPlaceholderController("Vendor", "listVendors");
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
