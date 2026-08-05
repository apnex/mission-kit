import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureAliasedRequestReferenceBindings,
} from "./support.mjs";

test(
  "a bound next task rejects two raw input keys that alias one resource reference",
  async () => {
    const scenario = await loadReducerScenario();
    configureAliasedRequestReferenceBindings(scenario);
    const reference =
      scenario.workspace.spec.activeHeads[0].reference;
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "next",
        inputs: {
          intake_reference: reference,
          policy_reference: reference,
        },
      },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "REQUEST_INPUT_REFERENCE_ALIAS",
    );
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.authority",
    );
  },
);
