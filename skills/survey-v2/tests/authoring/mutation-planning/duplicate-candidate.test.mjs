import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a duplicate created-resource candidate is rejected before mutation construction", async () => {
  const scenario = await taskScenario();
  const duplicate = structuredClone(scenario.args.products[0]);

  assertPlannerError(
    () => planScenario(scenario, {
      products: [scenario.args.products[0], duplicate],
    }),
    "PRODUCT_DUPLICATE",
  );
});
