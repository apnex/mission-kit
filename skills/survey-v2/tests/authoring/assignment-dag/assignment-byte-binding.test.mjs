import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentDigest,
  blankViewDigest,
  projectionOutputDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  textContentBytes
} from "../../../source/authoring/kernel/text-forms.mjs";
import { issueK10TextAssignment } from "./support.mjs";

test("an assignment binds the exact blank-view bytes and their domain digests", async () => {
  const {
    assignment,
    blankViewBytes,
    projectionArtifact
  } = await issueK10TextAssignment();

  const projectionBytes = textContentBytes(
    projectionArtifact.spec.output.content
  );
  const assignmentBytes = textContentBytes(
    assignment.spec.uneditedSkeleton.content
  );

  assert.deepEqual(projectionBytes, blankViewBytes);
  assert.deepEqual(assignmentBytes, blankViewBytes);
  assert.deepEqual(
    assignment.spec.uneditedSkeleton.content,
    projectionArtifact.spec.output.content
  );
  assert.equal(
    projectionArtifact.spec.output.outputDigest,
    projectionOutputDigest(blankViewBytes)
  );
  assert.equal(
    assignment.spec.uneditedSkeleton.blankViewDigest,
    blankViewDigest(blankViewBytes)
  );
  assert.equal(
    assignment.spec.projectionArtifact.projectionArtifactDigest,
    projectionArtifact.spec.projectionArtifactDigest
  );
  assert.equal(assignment.spec.assignmentDigest, assignmentDigest(assignment));
});
