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
  "a frozen task state with exactly one admitted task returns that task explicitly",
  async () => {
    const scenario = await loadReducerScenario();
    const selected = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );
    assert.deepEqual(
      {
        kind: selected.kind,
        stateId: selected.request.spec.operation.task.stateId,
        taskId: selected.request.spec.operation.task.id,
        transitionId: selected.request.spec.operation.task.transitionId,
      },
      {
        kind: "task",
        stateId: "draft_task",
        taskId: "draft-brief",
        transitionId: "AT01",
      },
    );
  },
);
