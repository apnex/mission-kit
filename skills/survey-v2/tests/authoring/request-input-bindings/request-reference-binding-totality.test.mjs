import assert from "node:assert/strict";
import test from "node:test";
import {
  contextSelectorDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateContractSemantics,
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
} from "../reducer/support.mjs";

test(
  "every request-reference selector is represented by one declared request input binding",
  async () => {
    const scenario = await loadReducerScenario();
    const task = scenario.profile.spec.tasks[0];
    const selector = task.contextSelectors[0];
    selector.selection = {
      mode: "request-reference",
      inputKey: "intake_reference",
    };
    selector.selectorDigest = contextSelectorDigest(selector);
    delete task.requestInputBindings;
    rehashAuthority(scenario);
    assert.deepEqual(
      validateContractSemantics(scenario.profile).map(
        (entry) => entry.code,
      ),
      ["REQUEST_INPUT_BINDING_MISSING"],
    );
  },
);
