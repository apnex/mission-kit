import assert from "node:assert/strict";
import test from "node:test";

import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  planScenario,
  taskScenario,
} from "./support.mjs";

test("a context-closure selector binds the created resource to the exact current closure", async () => {
  const scenario = await taskScenario();
  const product = scenario.args.products[0];
  product.dependencies = [{
    relation: "derived-from",
    selector: { mode: "context-closure" },
  }];

  const mutation = planScenario(scenario, {
    products: [product],
  });
  const contextClosure =
    scenario.transaction.byKind.get("ContextClosure");

  assert.deepEqual(
    mutation.spec.dependencyEdges.created,
    [{
      from: mutation.spec.createdResources[0].reference,
      to: resourceReferenceFrom(contextClosure),
      relation: "derived-from",
    }],
  );
});
