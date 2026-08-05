import assert from "node:assert/strict";
import test from "node:test";
import {
  selectNextAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import {
  loadReducerScenario,
} from "../reducer/support.mjs";

test(
  "a profile without execution closure retains unrestricted manifest selection",
  async () => {
    const scenario = await loadReducerScenario();
    assert.equal(
      Object.hasOwn(scenario.profile.spec, "executionClosure"),
      false,
    );
    const selected = selectNextAuthority(scenario);
    assert.equal(selected.kind, "task");
    assert.equal(selected.transition.id, "AT01");
  },
);
