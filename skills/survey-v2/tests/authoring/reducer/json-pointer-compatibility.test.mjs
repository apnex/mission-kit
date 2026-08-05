import assert from "node:assert/strict";
import test from "node:test";
import {
  compileExecutableRegistry,
  invokeValidator,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  createValidationIssue,
} from "../../../source/authoring/kernel/reducer-results.mjs";
import {
  executableDigest,
} from "./support.mjs";

const domainIssue = {
  code: "SUMMARY_INVALID",
  field: "/spec/summary",
  reason: "Summary is invalid.",
  correction: "Replace the invalid summary.",
};

test(
  "kernel and executable diagnostics admit schema-valid multi-segment JSON Pointers",
  () => {
    const issue = createValidationIssue({
      ...domainIssue,
      boundary: "request-validator",
      nextAction: "edit-and-resubmit",
    });
    assert.equal(issue.spec.field, "/spec/summary");

    const digest = executableDigest();
    const compiled = compileExecutableRegistry({
      guards: [],
      handlers: [],
      validators: [{
        id: "request-validator",
        digest,
        invoke: () => ({
          status: "reject",
          issues: [domainIssue],
        }),
      }],
    });
    assert.deepEqual(
      invokeValidator(
        compiled,
        { id: "request-validator", digest },
        {},
      ),
      {
        status: "reject",
        issues: [domainIssue],
      },
    );

    assert.throws(
      () => createValidationIssue({
        ...domainIssue,
        field: "/spec/~2summary",
        boundary: "request-validator",
        nextAction: "edit-and-resubmit",
      }),
      /canonical JSON Pointer/u,
    );
  },
);
