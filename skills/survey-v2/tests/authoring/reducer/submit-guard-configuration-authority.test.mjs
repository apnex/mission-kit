import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  validBriefProduct,
} from "./support.mjs";

test(
  "submission guards receive the exact manifest-declared handler configuration authority",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    let configuration;
    const result = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        guardInvoke: (input) => {
          configuration = input.configuration;
          return { status: "pass" };
        },
        handlerInvoke: () => ({
          status: "accept",
          products: [validBriefProduct(scenario)],
        }),
      }),
    );
    assert.equal(result.kind, "mutation");
    assert.deepEqual(
      configuration,
      scenario.profile.spec.transitionBindings[0].authority,
    );
  },
);
