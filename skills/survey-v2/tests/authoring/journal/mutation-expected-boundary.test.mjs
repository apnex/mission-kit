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

test("replay rejects a fully rederived Mutation whose expected state differs from the journal pre-image", () => {
  const scenario = appendTransitionScenario();
  const rewritten = rewriteTransitionAncestry(scenario, {
    mutateMutation(mutation) {
      mutation.spec.expected.semanticRevision += 1;
    },
  });

  assert.equal(
    errorCode(() => replayScenario(scenario, rewritten)),
    "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
  );
});
