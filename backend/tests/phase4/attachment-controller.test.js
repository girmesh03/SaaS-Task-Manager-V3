import Attachment from "../../models/Attachment.js";
import {
  createAttachment,
  deleteAttachment,
  restoreAttachment,
} from "../../controllers/attachmentController.js";
import { ATTACHMENT_FILE_TYPES } from "../../utils/constants.js";
import {
  assert,
  cleanupPhase4Fixture,
  createAssignedTaskDoc,
  createPhase4Fixture,
  runController,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const expectUnauthorized = (error, messageContains) => {
  assert(error?.name === "UnauthorizedError", "Expected UnauthorizedError");
  assert(error?.statusCode === 403, "Expected 403 unauthorized");
  if (messageContains) {
    assert(
      String(error.message || "").includes(messageContains),
      `Expected unauthorized message to include: ${messageContains}`
    );
  }
};

const main = async () => {
  await setupDb();
  const fixture = await createPhase4Fixture({ withSecondDepartmentUser: true });

  let failure = null;

  try {
    const task = await createAssignedTaskDoc({
      fixture,
      title: "Assigned with files",
      assigneeIds: [fixture.assignee._id],
      watcherIds: [fixture.actor._id, fixture.watcher._id],
    });

    const reqCreate = {
      user: fixture.actor,
      validated: {
        params: {},
        query: {},
        body: {
          filename: "test.pdf",
          fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1234/test.pdf",
          fileType: ATTACHMENT_FILE_TYPES[2],
          fileSize: 1024,
          parentModel: "Task",
          parent: task._id.toString(),
        },
      },
    };

    const resCreate = await runController(createAttachment, reqCreate);
    assert(resCreate.statusCode === 201, "Expected 201 attachment create");
    const attachmentId = resCreate.payload?.data?.attachment?.id;
    assert(attachmentId, "Expected attachment id");

    const createdAttachment = await Attachment.findById(attachmentId).withDeleted().select("isDeleted");
    assert(createdAttachment && createdAttachment.isDeleted === false, "Expected attachment active");

    const resDelete = await runController(deleteAttachment, {
      user: fixture.actor,
      validated: {
        params: { attachmentId },
        query: {},
        body: {},
      },
    });
    assert(resDelete.statusCode === 200, "Expected 200 attachment delete");

    const deletedAttachment = await Attachment.findById(attachmentId).withDeleted().select("isDeleted");
    assert(Boolean(deletedAttachment?.isDeleted), "Expected attachment to be soft-deleted");

    const resRestore = await runController(restoreAttachment, {
      user: fixture.actor,
      validated: {
        params: { attachmentId },
        query: {},
        body: {},
      },
    });
    assert(resRestore.statusCode === 200, "Expected 200 attachment restore");

    const restoredAttachment = await Attachment.findById(attachmentId).withDeleted().select("isDeleted");
    assert(restoredAttachment && restoredAttachment.isDeleted === false, "Expected attachment restored");

    // Cross-department guard in controller (defense-in-depth)
    const dept2User = fixture.secondDepartmentContext.user;
    assert(dept2User, "Expected second department user fixture");

    try {
      await runController(createAttachment, {
        user: dept2User,
        validated: reqCreate.validated,
      });
      throw new Error("Expected cross-department attachment upload to fail");
    } catch (error) {
      expectUnauthorized(error, "Cross-department access is not allowed");
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
  console.log("attachment-controller.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("attachment-controller.test.js failed", error);
  process.exit(1);
});

