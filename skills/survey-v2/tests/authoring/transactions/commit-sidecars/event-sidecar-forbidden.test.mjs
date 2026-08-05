import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics,
} from "../../../../source/authoring/kernel/contract-semantics.mjs";
import {
  createReducerSubmissionScenario,
  rehashAuthority,
} from "../../reducer/support.mjs";
import {
  validateContract,
} from "../../contracts/support/contract-validation.mjs";
import {
  attachSidecarAuthority,
  sidecarBindingId,
} from "./support.mjs";

test(
  "event transitions cannot acquire task-submission commit-sidecar authority",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    attachSidecarAuthority(scenario);
    const eventTransition =
      scenario.profile.spec.transitionBindings.find(
        (binding) => binding.triggerClass === "event",
      );
    eventTransition.commitSidecarBindingIds = [
      sidecarBindingId,
    ];
    rehashAuthority(scenario);

    const structural = await validateContract(
      "authoring-profile-manifest",
      scenario.profile,
    );
    const semantic = validateContractSemantics(
      scenario.profile,
    );

    assert.equal(structural.valid, false);
    assert.ok(structural.structuralErrors.length > 0);
    assert.ok(
      semantic.some(
        (issue) =>
          issue.code === "EVENT_COMMIT_SIDECAR_FORBIDDEN",
      ),
    );
  },
);
