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
  "a synchronous mutation contract validator returning a rejected Promise is consumed and rejected deterministically",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    assert.throws(
      () => planAuthoringMutation(taskMutationPlanArguments(
        scenario,
        [validBriefProduct(scenario)],
        () => Promise.reject(
          new Error("mutation-contract-promise-sentinel"),
        ),
      )),
      (error) => {
        assert.equal(
          error.code,
          "MUTATION_CONTRACT_INVALID",
        );
        return true;
      },
    );
    await new Promise((resolve) => setImmediate(resolve));
  },
);
