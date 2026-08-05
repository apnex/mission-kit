import test from "node:test";
import assert from "node:assert/strict";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";

test(
  "a frozen task state with multiple admitted task transitions fails closed explicitly",
  async () => {
    const scenario = await loadReducerScenario();
    scenario.protocol.spec.events.push({
      id: "SUBMIT_ALTERNATE",
      description: "Submit through an alternate declared edge",
    });
    scenario.protocol.spec.transitions.push({
      id: "AT03",
      source: { mode: "single", stateId: "draft_task" },
      eventId: "SUBMIT_ALTERNATE",
      toState: "awaiting_acceptance",
      guardIds: ["payload-valid"],
    });
    scenario.profile.spec.transitionBindings.push({
      ...structuredClone(scenario.profile.spec.transitionBindings[0]),
      transitionId: "AT03",
    });
    rehashAuthority(scenario);
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "AUTHORING_TASK_TRANSITION_AMBIGUOUS",
    );
  },
);
