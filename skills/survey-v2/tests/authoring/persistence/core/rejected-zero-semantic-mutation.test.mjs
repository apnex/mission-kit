import assert from "node:assert/strict";
import test from "node:test";
import { resourceReferenceFrom } from "../../../../source/authoring/kernel/digests.mjs";
import {
  applyEvidenceWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  assignmentBinding,
  assignmentResource,
  makeWorkspace,
  resource,
  stored,
} from "./support.mjs";

test("retaining a rejected attempt preserves semantic state and the open Assignment", () => {
  const assignment = assignmentResource();
  const issue = resource(
    "ValidationIssue",
    "issue-one",
    { code: "INVALID" },
    "authoring.mission-kit/v1alpha1",
  );
  const workspace = makeWorkspace({
    resources: [assignment],
    openAssignment: assignmentBinding(assignment),
  });
  const result = applyEvidenceWorkspace({
    workspace,
    retainedResourceVersions: [stored(issue)],
    historyReferences: [resourceReferenceFrom(issue)],
    openAssignmentAfter: assignmentBinding(assignment),
  });
  assert.deepEqual({
    semanticRevision: result.spec.semanticRevision,
    semanticStateDigest: result.spec.integrity.semanticStateDigest,
    openAssignment: result.spec.openAssignment,
  }, {
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
    openAssignment: workspace.spec.openAssignment,
  });
});
