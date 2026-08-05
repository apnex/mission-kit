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
  "request planning accepts only the manifest-resolved context closure from the exact workspace snapshot",
  async () => {
    const scenario = await loadReducerScenario();
    const selected = selectNextAuthority(scenario);
    const contextClosure = resolveContextClosure({
      workspace: scenario.workspace,
      selectors: selected.task.contextSelectors,
      requestInputs: {},
    });
    const forged = structuredClone(contextClosure);
    forged.spec.layers[0].selectedValue[0].value = [];
    assert.throws(
      () => buildTaskRequestDraft({
        ...scenario,
        task: selected.task,
        transition: selected.transition,
        contextClosure: forged,
        requestInputs: {},
      }),
      (error) => {
        assert.equal(
          error.code,
          "REQUEST_CONTEXT_CLOSURE_DIGEST_MISMATCH",
        );
        return true;
      },
    );
  },
);
