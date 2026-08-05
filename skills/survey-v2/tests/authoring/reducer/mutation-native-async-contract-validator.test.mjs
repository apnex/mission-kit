import assert from "node:assert/strict";
import test from "node:test";
import {
  planAuthoringMutation,
} from "../../../source/authoring/kernel/mutation-planner.mjs";
import {
  createReducerSubmissionScenario,
  taskMutationPlanArguments,
  validBriefProduct,
} from "./support.mjs";

test(
  "mutation planning rejects a native async contract validator before invoking it",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    let calls = 0;
    async function validateMutationContract() {
      calls += 1;
      return true;
    }
    assert.throws(
      () => planAuthoringMutation(taskMutationPlanArguments(
        scenario,
        [validBriefProduct(scenario)],
        validateMutationContract,
      )),
      (error) => {
        assert.equal(
          error.code,
          "MUTATION_CONTRACT_INVALID",
        );
        return true;
      },
    );
    assert.equal(calls, 0);
  },
);
