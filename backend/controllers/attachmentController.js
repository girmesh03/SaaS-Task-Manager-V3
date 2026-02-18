/**
 * @file Attachment controller placeholders.
 */
import { createPlaceholderController } from "./controllerPlaceholders.js";

export const createAttachment = createPlaceholderController("Attachment", "createAttachment");
export const deleteAttachment = createPlaceholderController("Attachment", "deleteAttachment");
export const restoreAttachment = createPlaceholderController("Attachment", "restoreAttachment");

export default {
  createAttachment,
  deleteAttachment,
  restoreAttachment,
};
