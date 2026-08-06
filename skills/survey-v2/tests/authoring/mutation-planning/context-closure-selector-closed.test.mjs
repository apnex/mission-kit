import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a context-closure dependency selector rejects every ambient field", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].dependencies = [{
    relation: "derived-from",
    selector: {
      mode: "context-closure",
      ordinal: 1,
    },
  }];

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "DEPENDENCY_SELECTOR_INVALID",
  );
});
