import { runValidation } from "../../middlewares/validation.js";
import { createTaskActivityValidators } from "../../middlewares/validators/index.js";
import {
  assert,
  cleanupPhase4Fixture,
  createPhase4Fixture,
  createProjectTaskDoc,
  setupDb,
  teardownDb,
} from "./test-helpers.js";

const expectValidationError = (error, messageContains) => {
  assert(
    error?.name === "ValidationError",
    `Expected ValidationError, got ${error?.name || "unknown"}: ${error?.message || ""}`
  );
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
    const task = await createProjectTaskDoc({ fixture });

    // Missing activity should fail
    const reqMissingActivity = {
      body: {},
      params: { taskId: task._id.toString() },
      query: {},
    };

    try {
      await runValidation(createTaskActivityValidators, reqMissingActivity);
      throw new Error("Expected createTaskActivityValidators to fail when activity is missing");
    } catch (error) {
      expectValidationError(error, "Activity description is required");
    }

    // Invalid quantity should fail (negative values are not treated as optional)
    const reqBadQty = {
      body: {
        activity: "Added materials",
        materials: [{ materialId: fixture.material._id.toString(), quantity: -1 }],
      },
      params: { taskId: task._id.toString() },
      query: {},
    };

    try {
      await runValidation(createTaskActivityValidators, reqBadQty);
      throw new Error("Expected createTaskActivityValidators to fail when quantity is negative");
    } catch (error) {
      expectValidationError(error, "materials.quantity must be greater than 0");
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
  console.log("taskActivity-validators.test.js passed");
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("taskActivity-validators.test.js failed", error);
  process.exit(1);
});
