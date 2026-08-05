import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  revisionScenario,
} from "./support.mjs";

test("a revision cannot submit a partial replacement group", async () => {
  const scenario = await revisionScenario();

  assertPlannerError(
    () => planScenario(scenario, { products: [] }),
    "REVISION_GROUP_MISMATCH",
  );
});
