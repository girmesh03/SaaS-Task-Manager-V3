/**
 * @file Canonical attachment route contracts (phase 2 scaffolding).
 */
import { Router } from "express";
import {
  createAttachmentValidators,
  deleteAttachmentValidators,
  restoreAttachmentValidators,
} from "../middlewares/validators/index.js";
import { authorize } from "../middlewares/authorization.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  createAttachment,
  deleteAttachment,
  restoreAttachment,
} from "../controllers/attachmentController.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  validate(createAttachmentValidators),
  authorize("Attachment", "create"),
  createAttachment
);
router.delete(
  "/:attachmentId",
  requireAuth,
  validate(deleteAttachmentValidators),
  authorize("Attachment", "delete"),
  deleteAttachment
);
router.patch(
  "/:attachmentId/restore",
  requireAuth,
  validate(restoreAttachmentValidators),
  authorize("Attachment", "delete"),
  restoreAttachment
);

export default router;
