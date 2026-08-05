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
  attachSidecarAuthority,
  sidecarBindingId,
} from "./support.mjs";

function limitIssues(profile) {
  return validateContractSemantics(profile)
    .filter((issue) =>
      issue.code.includes("SIDECAR_RESOURCE_LIMIT"));
}

test(
  "a transition admits 256 resources across bindings and rejects aggregate authority for 257",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    attachSidecarAuthority(scenario, {
      cardinality: { min: 0, max: 128 },
    });
    const second = structuredClone(
      scenario.profile.spec.commitSidecarBindings[0],
    );
    second.id = "commit-audit-binding-two";
    second.executable.id = "commit-audit-sidecar-two";
    scenario.profile.spec.commitSidecarBindings.push(second);
    const transition =
      scenario.profile.spec.transitionBindings.find(
        (binding) => binding.transitionId === "AT01",
      );
    transition.commitSidecarBindingIds = [
      sidecarBindingId,
      second.id,
    ];
    rehashAuthority(scenario);

    assert.deepEqual(limitIssues(scenario.profile), []);

    second.targets[0].cardinality.max = 129;
    rehashAuthority(scenario);
    assert.deepEqual(
      limitIssues(scenario.profile).map((issue) => issue.code),
      ["TRANSITION_SIDECAR_RESOURCE_LIMIT_EXCEEDED"],
    );
  },
);
