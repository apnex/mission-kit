import assert from "node:assert/strict";
import test from "node:test";
import {
  applyEvidenceWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  assignmentBinding,
  assignmentResource,
  makeWorkspace,
  stored,
} from "./support.mjs";

test("evidence application sets the exact retained Assignment binding", () => {
  const assignment = assignmentResource();
  const result = applyEvidenceWorkspace({
    workspace: makeWorkspace(),
    retainedResourceVersions: [stored(assignment)],
    openAssignmentAfter: assignmentBinding(assignment),
  });
  assert.deepEqual(result.spec.openAssignment, assignmentBinding(assignment));
});
