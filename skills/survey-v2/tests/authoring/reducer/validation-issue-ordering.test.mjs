import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createValidationIssue,
  sortValidationIssues,
} from "../../../source/authoring/kernel/reducer-results.mjs";

function issue(boundary, correction) {
  return createValidationIssue({
    code: "SUMMARY_INVALID",
    field: "/spec/summary",
    reason: "Summary is invalid.",
    boundary,
    nextAction: "edit-and-resubmit",
    correction,
  });
}

test(
  "validation issue ordering has a total canonical tie-break independent of input order",
  () => {
    const issues = [
      issue("schema-validator", "Replace the invalid summary."),
      issue("request-validator", "Edit and resubmit the summary."),
      issue("request-validator", "Replace the invalid summary."),
    ];
    const permutations = [
      [issues[0], issues[1], issues[2]],
      [issues[0], issues[2], issues[1]],
      [issues[1], issues[0], issues[2]],
      [issues[1], issues[2], issues[0]],
      [issues[2], issues[0], issues[1]],
      [issues[2], issues[1], issues[0]],
    ];
    const expected = canonicalize(sortValidationIssues(permutations[0]));
    for (const permutation of permutations) {
      assert.equal(
        canonicalize(sortValidationIssues(permutation)),
        expected,
      );
    }
  },
);
