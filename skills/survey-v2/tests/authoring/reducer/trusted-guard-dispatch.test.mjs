import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateTransitionGuards,
  selectNextAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import {
  loadReducerScenario,
  passRegistry,
} from "./support.mjs";

test(
  "guard dispatch occurs only through the exact host-trusted stable ID and executable digest",
  async () => {
    const scenario = await loadReducerScenario();
    const selected = selectNextAuthority(scenario);
    const calls = [];
    const compiledExecutables = passRegistry({
      guardInvoke(input) {
        calls.push(input.guardId);
        return { status: "pass" };
      },
    });
    const results = evaluateTransitionGuards({
      ...scenario,
      transition: selected.transition,
      compiledExecutables,
      input: { phase: "submission" },
    });
    assert.deepEqual(calls, ["payload-valid"]);
    assert.deepEqual(results, [
      {
        guardId: "payload-valid",
        result: { status: "pass" },
      },
    ]);
  },
);
