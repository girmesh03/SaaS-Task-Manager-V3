import { runValidation } from "../../middlewares/validation.js";
import {
  createTaskValidators,
  updateTaskValidators,
} from "../../middlewares/validators/index.js";
import { TASK_PRIORITY, TASK_TYPE } from "../../utils/constants.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createProjectTaskDoc,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const expectValidationError = (error, messageContains) => {
  assert(error?.name === "ValidationError", "Expected ValidationError");
  if (messageContains) {
    const details = Array.isArray(error.details) ? error.details : [];
    const matches = details.some((issue) =>
      String(issue?.message || "").includes(messageContains)
    );
    assert(matches, `Expected validation details to include: ${messageContains}`);
  }
};

const main = async () => {
  await setupDb();
  const fixture = await createPhase4Fixture();

  let failure = null;

  try {
    // updateTaskValidators: forbid type change
    const existingTask = await createProjectTaskDoc({ fixture });
    const reqUpdate = {
      body: { type: TASK_TYPE.ROUTINE },
      params: { taskId: existingTask._id.toString() },
      query: {},
    };

    try {
      await runValidation(updateTaskValidators, reqUpdate);
      throw new Error("Expected updateTaskValidators to fail when type is supplied");
    } catch (error) {
      expectValidationError(error, "Task type cannot be changed");
    }

    // createTaskValidators: enforce dueDate after startDate
    const reqCreate = {
      body: {
        type: TASK_TYPE.PROJECT,
        title: "Test project task",
        description: "A test project task description.",
        priority: TASK_PRIORITY.MEDIUM,
        vendorId: fixture.vendor._id.toString(),
        startDate: new Date("2025-01-02T00:00:00.000Z").toISOString(),
        dueDate: new Date("2025-01-01T00:00:00.000Z").toISOString(),
      },
      params: {},
      query: {},
    };

    try {
      await runValidation(createTaskValidators, reqCreate);
      throw new Error("Expected createTaskValidators to fail for invalid due/start ordering");
    } catch (error) {
      expectValidationError(error, "dueDate must be after startDate");
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
  console.log("task-validators.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("task-validators.test.js failed", error);
  process.exit(1);
});

