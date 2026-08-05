import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureRequestReferenceInputBinding,
} from "./support.mjs";

test(
  "a required request-reference omission is rejected before any Assignment or workspace mutation",
  async () => {
    const scenario = await loadReducerScenario();
    configureRequestReferenceInputBinding(scenario);
    const before = canonicalize(scenario.workspace);

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
      "CONTEXT_SELECTOR_CARDINALITY_MISMATCH",
    );
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.context",
    );
    assert.equal(Object.hasOwn(result, "request"), false);
    assert.equal(Object.hasOwn(result, "assignment"), false);
    assert.equal(canonicalize(scenario.workspace), before);
  },
);
