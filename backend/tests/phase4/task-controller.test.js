import Material from "../../models/Material.js";
import Task from "../../models/Task.js";
import {
  createTask,
  deleteTask,
  restoreTask,
  updateTask,
} from "../../controllers/taskController.js";
import { TASK_PRIORITY, TASK_STATUS, TASK_TYPE } from "../../utils/constants.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createProjectTaskDoc,
  runController,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const expectConflict = (error, messageContains) => {
  assert(error?.name === "ConflictError", "Expected ConflictError");
  assert(error?.statusCode === 409, "Expected 409 conflict");
  if (messageContains) {
    assert(
      String(error.message || "").includes(messageContains),
      `Expected conflict message to include: ${messageContains}`
    );
  }
};

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
    const materialBefore = await Material.findById(fixture.material._id).select(
      "inventory.stockOnHand"
    );
    const initialStock = Number(materialBefore?.inventory?.stockOnHand ?? 0);

    // create routine task consumes inventory
    const reqCreateRoutine = {
      user: fixture.actor,
      validated: {
        params: {},
        query: {},
        body: {
          type: TASK_TYPE.ROUTINE,
          title: "Routine create",
          description: "Routine task description content.",
          status: TASK_STATUS.TODO,
          priority: TASK_PRIORITY.MEDIUM,
          date: new Date().toISOString(),
          materials: [
            {
              materialId: fixture.material._id.toString(),
              quantity: 2,
            },
          ],
          watchers: [fixture.watcher._id.toString()],
        },
      },
    };

    const resCreate = await runController(createTask, reqCreateRoutine);
    assert(resCreate.statusCode === 201, "Expected 201 create");
    const createdTaskId = resCreate.payload?.data?.task?.id;
    assert(createdTaskId, "Expected created task id");

    const materialAfterCreate = await Material.findById(fixture.material._id).select(
      "inventory.stockOnHand"
    );
    assert(
      Number(materialAfterCreate?.inventory?.stockOnHand ?? 0) === initialStock - 2,
      "Expected stock to decrement by 2"
    );

    // create routine task insufficient stock -> 409
    const reqCreateFail = {
      user: fixture.actor,
      validated: {
        params: {},
        query: {},
        body: {
          type: TASK_TYPE.ROUTINE,
          title: "Routine fail",
          description: "Routine task description content.",
          status: TASK_STATUS.TODO,
          priority: TASK_PRIORITY.MEDIUM,
          date: new Date().toISOString(),
          materials: [
            {
              materialId: fixture.material._id.toString(),
              quantity: 9999,
            },
          ],
        },
      },
    };

    try {
      await runController(createTask, reqCreateFail);
      throw new Error("Expected createTask to fail with insufficient stock");
    } catch (error) {
      expectConflict(error, "Insufficient stock");
    }

    // delete routine task restores inventory
    const reqDelete = {
      user: fixture.actor,
      validated: {
        params: { taskId: createdTaskId },
        query: {},
        body: {},
      },
    };

    const resDelete = await runController(deleteTask, reqDelete);
    assert(resDelete.statusCode === 200, "Expected 200 delete");

    const deletedTask = await Task.findById(createdTaskId).withDeleted().select("isDeleted");
    assert(Boolean(deletedTask?.isDeleted), "Expected task to be soft-deleted");

    const materialAfterDelete = await Material.findById(fixture.material._id).select(
      "inventory.stockOnHand"
    );
    assert(
      Number(materialAfterDelete?.inventory?.stockOnHand ?? 0) === initialStock,
      "Expected stock to return to initial after delete"
    );

    // restore routine task fails when stock is insufficient
    await Material.findByIdAndUpdate(
      fixture.material._id,
      { $set: { "inventory.stockOnHand": 0 } },
      { new: true }
    );

    const reqRestoreFail = {
      user: fixture.actor,
      validated: {
        params: { taskId: createdTaskId },
        query: {},
        body: {},
      },
    };

    try {
      await runController(restoreTask, reqRestoreFail);
      throw new Error("Expected restoreTask to fail with insufficient stock to restore");
    } catch (error) {
      expectConflict(error, "Insufficient stock to restore");
    }

    // update project task dueDate ordering uses existing startDate
    const projectTask = await createProjectTaskDoc({ fixture, watcherIds: [fixture.actor._id] });
    const badDue = new Date(projectTask.startDate.getTime() - 60 * 60 * 1000).toISOString();

    const reqUpdate = {
      user: fixture.actor,
      validated: {
        params: { taskId: projectTask._id.toString() },
        query: {},
        body: {
          dueDate: badDue,
        },
      },
    };

    try {
      await runController(updateTask, reqUpdate);
      throw new Error("Expected updateTask to fail when dueDate <= startDate");
    } catch (error) {
      expectValidation(error, "dueDate must be after startDate");
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
  console.log("task-controller.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("task-controller.test.js failed", error);
  process.exit(1);
});

