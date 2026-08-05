import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("an ambiguous workspace active head fails closed before planning", async () => {
  const scenario = await taskScenario();
  const workspace = structuredClone(scenario.args.workspace);
  workspace.spec.activeHeads.push(
    structuredClone(workspace.spec.activeHeads[0]),
  );

  assertPlannerError(
    () => planScenario(scenario, { workspace }),
    "MUTATION_AUTHORITY_INVALID",
  );
});
