import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCommitOutcome,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import {
  digest,
} from "./support.mjs";

test("an outcome preserves ordered byte-identical K12 ValidationIssues", () => {
  const issue = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ValidationIssue",
    name: "issue-one",
    semanticDigest: digest("a"),
  };
  const outcome = assertCommitOutcome({
    class: "event-rejected",
    eventId: "ADVANCE",
    issues: [issue, structuredClone(issue)],
  }, { commitKind: "evidence" });

  assert.deepEqual(outcome.issues, [issue, issue]);
});
