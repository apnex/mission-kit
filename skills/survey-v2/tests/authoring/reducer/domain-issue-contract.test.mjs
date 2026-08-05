import test from "node:test";
import {
  compileExecutableRegistry,
  invokeValidator,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  assertRegistryError,
  executableDigest,
} from "./support.mjs";

const domainIssue = {
  code: "SUMMARY_INVALID",
  field: "/spec/summary",
  reason: "Summary is invalid.",
  correction: "Replace the invalid summary.",
};

test(
  "executable rejection diagnostics enforce the exact closed DomainIssue contract",
  () => {
    let currentIssue = domainIssue;
    const digest = executableDigest();
    const binding = { id: "request-validator", digest };
    const compiled = compileExecutableRegistry({
      guards: [],
      handlers: [],
      validators: [{
        ...binding,
        invoke: () => ({
          status: "reject",
          issues: [currentIssue],
        }),
      }],
    });

    for (const invalidIssue of [
      { ...domainIssue, reason: " \t " },
      { ...domainIssue, code: "A".repeat(81) },
      { ...domainIssue, undeclared: true },
    ]) {
      currentIssue = invalidIssue;
      assertRegistryError(
        () => invokeValidator(compiled, binding, {}),
        "EXECUTABLE_DOMAIN_ISSUE_INVALID",
      );
    }
  },
);
