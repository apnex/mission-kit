import assert from "node:assert/strict";
import test from "node:test";
import {
  validateTransactionClosureSemantics,
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "a staged execution closure does not weaken total protocol transition binding closure",
  async () => {
    const scenario = await loadReducerScenario();
    configureExecutionClosure(scenario, {
      transitionIds: ["AT01"],
    });
    scenario.profile.spec.transitionBindings =
      scenario.profile.spec.transitionBindings.filter(
        (binding) => binding.transitionId !== "AT02",
      );
    rehashAuthority(scenario);
    const issues = validateTransactionClosureSemantics(
      [scenario.profile, scenario.protocol],
      { roots: [scenario.profile] },
    );
    assert.equal(
      issues.some(
        (entry) =>
          entry.code === "TRANSITION_BINDING_CLOSURE_MISMATCH",
      ),
      true,
    );
  },
);
