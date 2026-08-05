import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("trusted coupling details cannot add, drop, or reorder the manifest sequence", async () => {
  const scenario = await taskScenario();
  const externalCouplings =
    structuredClone(scenario.args.externalCouplings).reverse();

  assertPlannerError(
    () => planScenario(scenario, { externalCouplings }),
    "EXTERNAL_COUPLING_MISMATCH",
  );
});
