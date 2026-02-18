/**
 * @file Canonical vendor route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  contactVendorValidators,
  createVendorValidators,
  deleteVendorValidators,
  listVendorValidators,
  restoreVendorValidators,
  updateVendorValidators,
  vendorIdValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  contactVendor,
  createVendor,
  deleteVendor,
  getVendor,
  listVendors,
  restoreVendor,
  updateVendor,
} from "../controllers/vendorController.js";

const router = Router();

router.get("/", requireAuth, validate(listVendorValidators), authorize("Vendor", "read"), listVendors);
router.post(
  "/",
  requireAuth,
  validate(createVendorValidators),
  authorize("Vendor", "create"),
  createVendor
);
router.get("/:vendorId", requireAuth, validate(vendorIdValidators), authorize("Vendor", "read"), getVendor);
router.put(
  "/:vendorId",
  requireAuth,
  validate(updateVendorValidators),
  authorize("Vendor", "update"),
  updateVendor
);
router.post(
  "/:vendorId/contact",
  requireAuth,
  validate(contactVendorValidators),
  authorize("Vendor", "update"),
  contactVendor
);
router.delete(
  "/:vendorId",
  requireAuth,
  validate(deleteVendorValidators),
  authorize("Vendor", "delete"),
  deleteVendor
);
router.patch(
  "/:vendorId/restore",
  requireAuth,
  validate(restoreVendorValidators),
  authorize("Vendor", "delete"),
  restoreVendor
);

export default router;
