import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a dependency relation cannot escape the manifest footprint", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].dependencies = [{
    relation: "ambient-relation",
    selector: { mode: "context-layer", ordinal: 1 },
  }];

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "DEPENDENCY_RELATION_UNDECLARED",
  );
});
