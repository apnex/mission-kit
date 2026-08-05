import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics,
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadReducerScenario,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "execution closure rejects an unresolved transition authority",
  async () => {
    const scenario = await loadReducerScenario();
    configureExecutionClosure(scenario, {
      transitionIds: ["AT99"],
    });
    assert.deepEqual(
      validateContractSemantics(scenario.profile).map(
        (entry) => entry.code,
      ),
      ["EXECUTION_CLOSURE_TRANSITION_UNRESOLVED"],
    );
  },
);
