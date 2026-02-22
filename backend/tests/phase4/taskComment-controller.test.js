import Notification from "../../models/Notification.js";
import TaskComment from "../../models/TaskComment.js";
import User from "../../models/User.js";
import { createTaskComment } from "../../controllers/taskCommentController.js";
import { USER_ROLES, USER_STATUS } from "../../utils/constants.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createRoutineTaskDoc,
  runController,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const expectValidation = (error, messageContains) => {
  assert(error?.name === "ValidationError", "Expected ValidationError");
  assert(error?.statusCode === 400, "Expected 400 validation error");
  if (messageContains) {
    assert(
      String(error.message || "").includes(messageContains),
      `Expected validation message to include: ${messageContains}`
    );
  }
};

const main = async () => {
  await setupDb();
  const fixture = await createPhase4Fixture();

  let failure = null;

  try {
    const task = await createRoutineTaskDoc({
      fixture,
      title: "Routine with comments",
      watcherIds: [fixture.actor._id, fixture.watcher._id],
    });

    // Mention parsing resolves by email local-part (case-insensitive)
    const mentionLocal = String(fixture.mentionUser.email).split("@")[0];
    const reqMention = {
      user: fixture.actor,
      validated: {
        params: { taskId: task._id.toString() },
        query: {},
        body: {
          comment: `Hello @${mentionLocal}`,
          parentModel: "Task",
          parentId: task._id.toString(),
        },
      },
    };

    const resMention = await runController(createTaskComment, reqMention);
    assert(resMention.statusCode === 201, "Expected 201 create comment");

    const createdCommentId = resMention.payload?.data?.comment?.id;
    assert(createdCommentId, "Expected created comment id");

    const commentDoc = await TaskComment.findById(createdCommentId).withDeleted().select("mentions");
    const mentionIds = Array.isArray(commentDoc?.mentions) ? commentDoc.mentions.map(String) : [];
    assert(
      mentionIds.includes(fixture.mentionUser._id.toString()),
      "Expected mention user to be resolved and persisted"
    );

    const mentionNotification = await Notification.findOne({
      user: fixture.mentionUser._id,
      entityModel: "TaskComment",
      entity: createdCommentId,
      isDeleted: false,
    });
    assert(mentionNotification, "Expected a mention notification to be created");

    // Ambiguous mentions are ignored
    const suffix = fixture.suffix.replace(/[^a-z0-9]/gi, "");
    const userA = await User.create({
      firstName: "John",
      lastName: "Dot",
      position: "User",
      email: `john.doe${suffix}@gmail.com`,
      password: "12345678",
      role: USER_ROLES.USER,
      status: USER_STATUS.ACTIVE,
      organization: fixture.organization._id,
      department: fixture.department._id,
      isVerified: true,
      emailVerifiedAt: new Date(),
      joinedAt: new Date(),
    });

    const userB = await User.create({
      firstName: "John",
      lastName: "Plain",
      position: "User",
      email: `johndoe${suffix}@gmail.com`,
      password: "12345678",
      role: USER_ROLES.USER,
      status: USER_STATUS.ACTIVE,
      organization: fixture.organization._id,
      department: fixture.department._id,
      isVerified: true,
      emailVerifiedAt: new Date(),
      joinedAt: new Date(),
    });

    const reqAmbiguous = {
      user: fixture.actor,
      validated: {
        params: { taskId: task._id.toString() },
        query: {},
        body: {
          comment: `Ping @john.doe${suffix}`,
          parentModel: "Task",
          parentId: task._id.toString(),
        },
      },
    };

    const resAmbiguous = await runController(createTaskComment, reqAmbiguous);
    const ambiguousId = resAmbiguous.payload?.data?.comment?.id;
    assert(ambiguousId, "Expected created ambiguous comment id");

    const ambiguousDoc = await TaskComment.findById(ambiguousId).withDeleted().select("mentions");
    assert(
      Array.isArray(ambiguousDoc?.mentions) && ambiguousDoc.mentions.length === 0,
      "Expected ambiguous mention to be ignored"
    );

    // Depth guard: max 5
    const resRoot = await runController(createTaskComment, {
      user: fixture.actor,
      validated: {
        params: { taskId: task._id.toString() },
        query: {},
        body: {
          comment: "Root",
          parentModel: "Task",
          parentId: task._id.toString(),
        },
      },
    });
    let parentId = resRoot.payload?.data?.comment?.id;
    assert(parentId, "Expected root comment id");

    for (let i = 0; i < 5; i += 1) {
      const resReply = await runController(createTaskComment, {
        user: fixture.actor,
        validated: {
          params: { taskId: task._id.toString() },
          query: {},
          body: {
            comment: `Reply ${i + 1}`,
            parentModel: "TaskComment",
            parentId,
          },
        },
      });
      parentId = resReply.payload?.data?.comment?.id;
      assert(parentId, "Expected reply id");
    }

    try {
      await runController(createTaskComment, {
        user: fixture.actor,
        validated: {
          params: { taskId: task._id.toString() },
          query: {},
          body: {
            comment: "Too deep",
            parentModel: "TaskComment",
            parentId,
          },
        },
      });
      throw new Error("Expected createTaskComment to fail when depth exceeds 5");
    } catch (error) {
      expectValidation(error, "Comment depth cannot exceed 5");
    }

    // Keep linter happy for unused variables in non-test envs
    assert(userA && userB, "Expected ambiguous users to exist");
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
  console.log("taskComment-controller.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("taskComment-controller.test.js failed", error);
  process.exit(1);
});

