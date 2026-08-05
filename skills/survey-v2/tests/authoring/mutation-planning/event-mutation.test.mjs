import assert from "node:assert/strict";
import test from "node:test";

import {
  planScenario,
  eventScenario,
} from "./support.mjs";

test("event ancestry produces only its manifest-owned empty mutation", async () => {
  const scenario = await eventScenario();
  const mutation = planScenario(scenario);

  assert.equal(mutation.spec.cause.class, "event");
  assert.equal(mutation.spec.cause.edge.transitionId, "AT02");
  assert.equal(mutation.spec.nextAuthoringState, "complete");
  assert.deepEqual(mutation.spec.createdResources, []);
  assert.deepEqual(mutation.spec.activeHeadChanges, []);
  assert.deepEqual(mutation.spec.supersededResources, []);
  assert.deepEqual(mutation.spec.externalCouplings, []);
});
