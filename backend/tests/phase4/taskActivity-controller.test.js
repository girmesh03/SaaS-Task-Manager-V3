import Material from "../../models/Material.js";
import TaskActivity from "../../models/TaskActivity.js";
import {
  createTaskActivity,
  deleteTaskActivity,
  restoreTaskActivity,
} from "../../controllers/taskActivityController.js";
import { TASK_TYPE } from "../../utils/constants.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createProjectTaskDoc,
  createRoutineTaskDoc,
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

const main = async () => {
  await setupDb();
  const fixture = await createPhase4Fixture();

  let failure = null;

  try {
    // RoutineTask: activity creation is blocked (409)
    const routineTask = await createRoutineTaskDoc({ fixture, title: "Routine no activity" });
    assert(routineTask.type === TASK_TYPE.ROUTINE, "Expected routine task fixture");

    const reqRoutine = {
      user: fixture.actor,
      validated: {
        params: { taskId: routineTask._id.toString() },
        query: {},
        body: { activity: "Should fail" },
      },
    };

    try {
      await runController(createTaskActivity, reqRoutine);
      throw new Error("Expected createTaskActivity to fail for routine tasks");
    } catch (error) {
      expectConflict(error, "Cannot create activities for routine tasks");
    }

    // ProjectTask: create activity consumes inventory, delete restores, restore re-consumes
    const projectTask = await createProjectTaskDoc({
      fixture,
      title: "Project with activities",
      watcherIds: [fixture.actor._id, fixture.watcher._id],
    });

    const materialBefore = await Material.findById(fixture.materialTwo._id).select(
      "inventory.stockOnHand"
    );
    const initialStock = Number(materialBefore?.inventory?.stockOnHand ?? 0);

    const reqCreate = {
      user: fixture.actor,
      validated: {
        params: { taskId: projectTask._id.toString() },
        query: {},
        body: {
          activity: "Used some materials",
          materials: [{ materialId: fixture.materialTwo._id.toString(), quantity: 3 }],
        },
      },
    };

    const resCreate = await runController(createTaskActivity, reqCreate);
    assert(resCreate.statusCode === 201, "Expected 201 create activity");
    const activityId = resCreate.payload?.data?.activity?.id;
    assert(activityId, "Expected created activity id");

    const materialAfterCreate = await Material.findById(fixture.materialTwo._id).select(
      "inventory.stockOnHand"
    );
    assert(
      Number(materialAfterCreate?.inventory?.stockOnHand ?? 0) === initialStock - 3,
      "Expected activity create to decrement stock by 3"
    );

    const reqDelete = {
      user: fixture.actor,
      validated: {
        params: { taskId: projectTask._id.toString(), activityId },
        query: {},
        body: {},
      },
    };

    const resDelete = await runController(deleteTaskActivity, reqDelete);
    assert(resDelete.statusCode === 200, "Expected 200 delete activity");

    const deletedActivity = await TaskActivity.findById(activityId).withDeleted().select("isDeleted");
    assert(Boolean(deletedActivity?.isDeleted), "Expected activity to be soft-deleted");

    const materialAfterDelete = await Material.findById(fixture.materialTwo._id).select(
      "inventory.stockOnHand"
    );
    assert(
      Number(materialAfterDelete?.inventory?.stockOnHand ?? 0) === initialStock,
      "Expected activity delete to restore stock"
    );

    // Restore should fail when stock is insufficient
    await Material.findByIdAndUpdate(
      fixture.materialTwo._id,
      { $set: { "inventory.stockOnHand": 0 } },
      { new: true }
    );

    const reqRestoreFail = {
      user: fixture.actor,
      validated: {
        params: { taskId: projectTask._id.toString(), activityId },
        query: {},
        body: {},
      },
    };

    try {
      await runController(restoreTaskActivity, reqRestoreFail);
      throw new Error("Expected restoreTaskActivity to fail with insufficient stock to restore");
    } catch (error) {
      expectConflict(error, "Insufficient stock to restore");
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
  console.log("taskActivity-controller.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("taskActivity-controller.test.js failed", error);
  process.exit(1);
});

