import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a handler candidate cannot choose state, heads, or supersession", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].supersededResources = [];

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "PRODUCT_CANDIDATE_INVALID",
  );
});
