import assert from "node:assert/strict";
import test from "node:test";

import {
  planScenario,
  revisionScenario,
} from "./support.mjs";

test("revision supersession includes the replacement head and declared transitive descendant", async () => {
  const scenario = await revisionScenario({ descendant: true });
  const mutation = planScenario(scenario);
  const priorHead =
    scenario.args.authority.expectedHeads[0].reference;

  assert.deepEqual(mutation.spec.supersededResources, [
    priorHead,
    scenario.descendantRecord.reference,
  ]);
  assert.deepEqual(mutation.spec.dependencyEdges.superseded, [{
    from: scenario.descendantRecord.reference,
    to: priorHead,
    relation: "derived-from",
  }]);
  assert.equal(
    mutation.spec.activeHeadChanges[0].before.semanticDigest,
    priorHead.semanticDigest,
  );
  assert.equal(
    mutation.spec.activeHeadChanges[0].after.name,
    "launch-brief-revised",
  );
});
