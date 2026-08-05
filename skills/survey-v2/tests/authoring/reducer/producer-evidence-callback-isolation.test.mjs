import assert from "node:assert/strict";
import test from "node:test";
import {
  sha256Value,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  validBriefProduct,
} from "./support.mjs";

async function reduceForProducer(producerId) {
  const scenario = await createReducerSubmissionScenario();
  scenario.submission.evidence.producerProvenance.producerId = producerId;
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
        return {
          status: "accept",
          products: [validBriefProduct(scenario)],
        };
      },
    }),
  );
  return {
    callbackInputs,
    normalizedSubmissionDigest:
      scenario.submission.spec.normalizedSubmissionDigest,
    resultDigest: sha256Value(result),
  };
}

test(
  "producer evidence is absent from callback authority and cannot alter semantic reduction",
  async () => {
    const first = await reduceForProducer("producer-alpha");
    const second = await reduceForProducer("producer-beta");

    assert.equal(
      second.normalizedSubmissionDigest,
      first.normalizedSubmissionDigest,
    );
    assert.deepEqual(second.callbackInputs, first.callbackInputs);
    assert.equal(second.resultDigest, first.resultDigest);
  },
);
