/**
 * @file Canonical material route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createMaterialValidators,
  deleteMaterialValidators,
  listMaterialValidators,
  materialIdValidators,
  materialUsageValidators,
  restockMaterialValidators,
  restoreMaterialValidators,
  updateMaterialValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
  getMaterialUsage,
  listMaterials,
  restockMaterial,
  restoreMaterial,
  updateMaterial,
} from "../controllers/materialController.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listMaterialValidators),
  authorize("Material", "read"),
  listMaterials
);
router.post(
  "/",
  requireAuth,
  validate(createMaterialValidators),
  authorize("Material", "create"),
  createMaterial
);
router.get(
  "/:materialId",
  requireAuth,
  validate(materialIdValidators),
  authorize("Material", "read"),
  getMaterial
);
router.get(
  "/:materialId/usage",
  requireAuth,
  validate(materialUsageValidators),
  authorize("Material", "read"),
  getMaterialUsage
);
router.put(
  "/:materialId",
  requireAuth,
  validate(updateMaterialValidators),
  authorize("Material", "update"),
  updateMaterial
);
router.post(
  "/:materialId/restock",
  requireAuth,
  validate(restockMaterialValidators),
  authorize("Material", "update"),
  restockMaterial
);
router.delete(
  "/:materialId",
  requireAuth,
  validate(deleteMaterialValidators),
  authorize("Material", "delete"),
  deleteMaterial
);
router.patch(
  "/:materialId/restore",
  requireAuth,
  validate(restoreMaterialValidators),
  authorize("Material", "delete"),
  restoreMaterial
);

export default router;
