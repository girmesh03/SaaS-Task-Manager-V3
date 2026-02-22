import { runValidation } from "../../middlewares/validation.js";
import { createTaskCommentValidators } from "../../middlewares/validators/index.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createRoutineTaskDoc,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const main = async () => {
  await setupDb();
  const fixture = await createPhase4Fixture();

  let failure = null;

  try {
    const task = await createRoutineTaskDoc({ fixture });

    const req = {
      body: {
        comment: "Hello world",
        parentModel: "Task",
        parentId: task._id.toString(),
        depth: 3,
        mentions: [fixture.assignee._id.toString()],
      },
      params: { taskId: task._id.toString() },
      query: {},
    };

    await runValidation(createTaskCommentValidators, req);
    assert(req.validated?.body?.comment === "Hello world", "Expected comment to be validated");
    assert(req.validated?.body?.depth === undefined, "depth must not be accepted from client");
    assert(req.validated?.body?.mentions === undefined, "mentions must not be accepted from client");
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
  console.log("taskComment-validators.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("taskComment-validators.test.js failed", error);
  process.exit(1);
});

