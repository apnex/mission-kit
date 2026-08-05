import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  validBriefProduct,
} from "../reducer/support.mjs";

test(
  "submission replay reconstructs the exact request from closure-derived ancestry inputs",
  async () => {
    const scenario = await createReducerSubmissionScenario({
      mutateAuthority(authority) {
        const task = authority.profile.spec.tasks[0];
        task.requestInputBindings = [{
          inputKey: "intake_ancestry",
          selectorId: task.contextSelectors[0].id,
        }];
      },
    });
    assert.deepEqual(
      Object.keys(scenario.request.spec.operation.inputs),
      ["intake_ancestry"],
    );
    const result = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: [validBriefProduct(scenario)],
        }),
      }),
    );
    assert.equal(result.kind, "mutation");
  },
);
