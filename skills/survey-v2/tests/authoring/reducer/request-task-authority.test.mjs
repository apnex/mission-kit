import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContextClosure,
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  buildTaskRequestDraft,
} from "../../../source/authoring/kernel/request-planner.mjs";
import {
  selectNextAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import { loadReducerScenario } from "./support.mjs";

test(
  "request planning rejects a task body that differs from exact profile authority",
  async () => {
    const scenario = await loadReducerScenario();
    const selected = selectNextAuthority(scenario);
    const contextClosure = resolveContextClosure({
      workspace: scenario.workspace,
      selectors: selected.task.contextSelectors,
      requestInputs: {},
    });
    const forged = structuredClone(selected.task);
    forged.target.resourceType.kind = "Rogue";
    assert.throws(
      () => buildTaskRequestDraft({
        ...scenario,
        task: forged,
        transition: selected.transition,
        contextClosure,
        requestInputs: {},
      }),
      (error) => {
        assert.equal(error.code, "REQUEST_TASK_AUTHORITY_MISMATCH");
        return true;
      },
    );
  },
);
