import assert from "node:assert/strict";
import test from "node:test";
import {
  sha256Value,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  rehashAuthority,
  validBriefProduct,
} from "./support.mjs";

async function reduceAtEvidenceRevision(evidenceRevision) {
  const scenario = await createReducerSubmissionScenario();
  scenario.workspace.spec.evidenceRevision = evidenceRevision;
  rehashAuthority(scenario);
  const callbackInputs = {};
  const result = await executeReducerSubmission(
    scenario,
    passRegistrySource({
      guardInvoke(input) {
        callbackInputs.guard = sha256Value(input);
        return { status: "pass" };
      },
      handlerInvoke(input) {
        callbackInputs.handler = sha256Value(input);
        const visibleRevision =
          input.workspace?.spec?.evidenceRevision ?? "semantic";
        return {
          status: "accept",
          products: [validBriefProduct(scenario, {
            name: `launch-brief-${visibleRevision}`,
          })],
        };
      },
    }),
  );
  return {
    callbackInputs,
    requestDigest: scenario.request.spec.requestDigest,
    semanticStateDigest:
      scenario.workspace.spec.integrity.semanticStateDigest,
    resultDigest: sha256Value(result),
  };
}

test(
  "evidence-only workspace changes are absent from callback authority and semantic reduction",
  async () => {
    const first = await reduceAtEvidenceRevision(0);
    const second = await reduceAtEvidenceRevision(7);

    assert.equal(second.requestDigest, first.requestDigest);
    assert.equal(second.semanticStateDigest, first.semanticStateDigest);
    assert.deepEqual(second.callbackInputs, first.callbackInputs);
    assert.equal(second.resultDigest, first.resultDigest);
  },
);
