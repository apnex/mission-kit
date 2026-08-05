import assert from "node:assert/strict";
import test from "node:test";
import {
  createValidationIssue,
  mutationResult,
  sortValidationIssues,
  taskResult,
  terminalResult,
  waitResult,
} from "../../../source/authoring/kernel/reducer-results.mjs";

function issueFields(overrides = {}) {
  return {
    code: "SUMMARY_INVALID",
    field: "/spec/summary",
    reason: "Summary is invalid.",
    boundary: "request-validator",
    nextAction: "edit-and-resubmit",
    correction: "Replace the invalid summary.",
    ...overrides,
  };
}

test(
  "validation issues and reducer result constructors reject widened or identity-free values",
  () => {
    assert.throws(
      () => createValidationIssue(issueFields({ reason: " \t " })),
      /non-whitespace/u,
    );
    assert.throws(
      () => createValidationIssue(issueFields({ code: "A".repeat(81) })),
      /code is invalid/u,
    );
    assert.throws(
      () => createValidationIssue({
        ...issueFields(),
        undeclared: true,
      }),
      /exact and closed/u,
    );

    const issue = createValidationIssue(issueFields());
    const wrongName = structuredClone(issue);
    wrongName.metadata.name = `issue-${"0".repeat(64)}`;
    assert.throws(
      () => sortValidationIssues([wrongName]),
      /semantic identity/u,
    );
    const widened = structuredClone(issue);
    widened.spec.undeclared = true;
    assert.throws(
      () => sortValidationIssues([widened]),
      /exact ValidationIssue/u,
    );

    assert.deepEqual(
      waitResult({
        id: "awaiting_acceptance",
        label: "Await acceptance",
        class: "wait",
      }),
      {
        kind: "wait",
        state: {
          id: "awaiting_acceptance",
          label: "Await acceptance",
          class: "wait",
        },
      },
    );
    assert.throws(
      () => waitResult({
        id: "awaiting_acceptance",
        label: "Await acceptance",
        class: "wait",
        taskId: "undeclared",
      }),
      /exact closed state/u,
    );
    assert.throws(
      () => terminalResult({
        id: "complete",
        label: "Complete",
        class: "wait",
      }),
      /exact closed state/u,
    );
    assert.throws(
      () => taskResult({ contextClosure: {}, request: {} }),
      /ContextClosure resource shell/u,
    );
    assert.throws(
      () => mutationResult({
        apiVersion: "authoring.mission-kit/v1alpha1",
        kind: "AuthoringMutation",
        metadata: { name: "caller-chosen" },
        spec: {},
      }),
      /AuthoringMutation resource shell/u,
    );
  },
);
