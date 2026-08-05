import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  replayScenario,
} from "./support.mjs";
import {
  rewriteTransitionAncestry,
} from "./transition-tamper-support.mjs";

test("replay rejects a fully rederived Receipt whose supersession disposition differs from its Mutation", () => {
  const scenario = appendTransitionScenario({
    supersedeAssignment: true,
  });
  const rewritten = rewriteTransitionAncestry(scenario, {
    mutateReceipt(receipt) {
      receipt.spec.supersededDescendants[0].disposition =
        "superseded";
      receipt.spec.supersededDescendants[0].supersededBy =
        structuredClone(
          scenario.mutation.spec.createdResources[0].reference,
        );
    },
  });

  assert.equal(
    errorCode(() => replayScenario(scenario, rewritten)),
    "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
  );
});
