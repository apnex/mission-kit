import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a handler must satisfy every manifest target cardinality", async () => {
  const scenario = await taskScenario();

  assertPlannerError(
    () => planScenario(scenario, { products: [] }),
    "PRODUCT_CARDINALITY_MISMATCH",
  );
});
