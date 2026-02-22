import { runValidation } from "../../middlewares/validation.js";
import { createAttachmentValidators } from "../../middlewares/validators/index.js";
import { ATTACHMENT_FILE_TYPES } from "../../utils/constants.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createRoutineTaskDoc,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const expectValidationError = (error, messageContains) => {
  assert(error?.name === "ValidationError", "Expected ValidationError");
  const details = Array.isArray(error.details) ? error.details : [];
  const matches = details.some((issue) =>
    String(issue?.message || "").includes(messageContains)
  );
  assert(matches, `Expected validation details to include: ${messageContains}`);
};

const main = async () => {
  await setupDb();
  const fixture = await createPhase4Fixture();

  let failure = null;

  try {
    const task = await createRoutineTaskDoc({ fixture });

    const reqBadUrl = {
      body: {
        filename: "test.pdf",
        fileUrl: "https://example.com/not-cloudinary.pdf",
        fileType: ATTACHMENT_FILE_TYPES[2],
        fileSize: 1024,
        parentModel: "Task",
        parent: task._id.toString(),
      },
      params: {},
      query: {},
    };

    try {
      await runValidation(createAttachmentValidators, reqBadUrl);
      throw new Error("Expected createAttachmentValidators to fail for invalid fileUrl");
    } catch (error) {
      expectValidationError(error, "fileUrl must match Cloudinary URL format");
    }

    const reqBadParentModel = {
      body: {
        filename: "test.pdf",
        fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1234/test.pdf",
        fileType: ATTACHMENT_FILE_TYPES[2],
        fileSize: 1024,
        parentModel: "Material",
        parent: task._id.toString(),
      },
      params: {},
      query: {},
    };

    try {
      await runValidation(createAttachmentValidators, reqBadParentModel);
      throw new Error("Expected createAttachmentValidators to fail for invalid parentModel");
    } catch (error) {
      expectValidationError(error, "Attachment parentModel is invalid");
    }
  } catch (error) {
    failure = error;
  } finally {
    await cleanupPhase4Fixture(fixture);
    await teardownDb();
  }

  if (failure) {
    throw failure;
  }

  // eslint-disable-next-line no-console
  console.log("attachment-validators.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("attachment-validators.test.js failed", error);
  process.exit(1);
});

