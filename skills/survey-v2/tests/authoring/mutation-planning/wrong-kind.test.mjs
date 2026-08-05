import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a handler product cannot widen its manifest resource kind", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].resource.kind = "ForeignBrief";

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "PRODUCT_TYPE_MISMATCH",
  );
});
