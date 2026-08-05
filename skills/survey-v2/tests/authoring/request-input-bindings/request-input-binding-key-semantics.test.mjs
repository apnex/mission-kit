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
  "a request-reference binding key must equal its selector input key",
  async () => {
    const scenario = await loadReducerScenario();
    const task = scenario.profile.spec.tasks[0];
    const selector = task.contextSelectors[0];
    selector.selection = {
      mode: "request-reference",
      inputKey: "declared_reference",
    };
    selector.selectorDigest = contextSelectorDigest(selector);
    task.requestInputBindings = [{
      inputKey: "different_reference",
      selectorId: selector.id,
    }];
    rehashAuthority(scenario);
    assert.deepEqual(
      validateContractSemantics(scenario.profile).map(
        (entry) => entry.code,
      ),
      ["REQUEST_INPUT_BINDING_KEY_MISMATCH"],
    );
  },
);
