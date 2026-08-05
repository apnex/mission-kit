import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("the injected mutation contract validator must return synchronously", async () => {
  const scenario = await taskScenario();

  assertPlannerError(
    () => planScenario(scenario, {
      validateMutationContract: async () => true,
    }),
    "MUTATION_CONTRACT_INVALID",
  );
});
