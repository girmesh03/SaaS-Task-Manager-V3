/**
 * @file Material controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const listMaterials = createPlaceholderController("Material", "listMaterials");
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
