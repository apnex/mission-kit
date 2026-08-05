import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "./support.mjs";

test(
  "the reducer derives legal task and transition authority only from the pinned declarative protocol and profile manifest",
  async () => {
    const scenario = await loadReducerScenario();
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "task");
    assert.equal(result.request.spec.operation.task.stateId, "draft_task");
    assert.equal(result.request.spec.operation.task.id, "draft-brief");
    assert.equal(result.request.spec.operation.task.transitionId, "AT01");
  },
);
