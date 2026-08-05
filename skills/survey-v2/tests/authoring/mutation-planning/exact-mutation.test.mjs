import assert from "node:assert/strict";
import test from "node:test";

import {
  mutationDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  planScenario,
  taskScenario,
} from "./support.mjs";

test("the planner derives the complete exact task mutation from weak products", async () => {
  const scenario = await taskScenario();
  const products = structuredClone(scenario.args.products);
  products[0].dependencies = [{
    relation: "derived-from",
    selector: { mode: "context-layer", ordinal: 1 },
  }];

  const mutation = planScenario(scenario, { products });
  const created = mutation.spec.createdResources[0];
  const source = scenario.workspace.spec.activeHeads[0].reference;

  assert.deepEqual(created.reference, resourceReferenceFrom(created.resource));
  assert.equal(
    created.integrityDigest,
    resourceIntegrityDigest(created.resource),
  );
  assert.deepEqual(mutation.spec.dependencyEdges.created, [{
    from: created.reference,
    to: source,
    relation: "derived-from",
  }]);
  assert.deepEqual(mutation.spec.activeHeadChanges, [{
    slot: "brief",
    before: null,
    after: created.reference,
  }]);
  assert.deepEqual(mutation.spec.handoffProducts, [{
    slot: "brief",
    reference: created.reference,
  }]);
  assert.deepEqual(
    mutation.spec.externalCouplings,
    scenario.args.externalCouplings,
  );
  assert.equal(mutation.spec.mutationDigest, mutationDigest(mutation));
  assert.equal(
    mutation.metadata.name,
    `mutation-${mutation.spec.mutationDigest.slice("sha256:".length)}`,
  );
  assert.equal(Object.isFrozen(mutation), true);
  assert.equal(Object.isFrozen(mutation.spec.createdResources[0]), true);
});
