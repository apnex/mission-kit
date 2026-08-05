import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a handler product cannot escape to an undeclared slot", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].slot = "ambient";

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "PRODUCT_SLOT_UNDECLARED",
  );
});
