import test from "node:test";

import {
  assertPlannerError,
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a dependency selector cannot resolve an ambient or missing active head", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].dependencies = [{
    relation: "derived-from",
    selector: { mode: "active-head", slot: "ambient" },
  }];

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "DEPENDENCY_SELECTOR_UNRESOLVED",
  );
});
