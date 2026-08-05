import assert from "node:assert/strict";
import test from "node:test";
import {
  rawEvidenceDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createTextSubmission
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  textContentBytes
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  issueK10TextAssignment,
  populatedTextBytes,
  producerProvenance
} from "./support.mjs";

test("raw evidence preserves submitted bytes while parsing normalizes newlines", async () => {
  const scenario = await issueK10TextAssignment();
  const canonicalBytes = populatedTextBytes(scenario);
  const submittedBytes = Buffer.from(
    canonicalBytes.toString("utf8").replaceAll("\n", "\r\n"),
    "utf8"
  );
  const { parsed, submission } = createTextSubmission({
    name: "brief-submission",
    request: scenario.request,
    contextClosure: scenario.contextClosure,
    assignment: scenario.assignment,
    projectionArtifact: scenario.projectionArtifact,
    projectionBinding: scenario.projectionBinding,
    formDefinition: scenario.formDefinition,
    submittedBytes,
    producerProvenance: producerProvenance(),
    renderProjection: scenario.renderProjection
  });

  assert.equal(parsed.newlineNormalized, true);
  assert.deepEqual(parsed.canonicalBytes, canonicalBytes);
  assert.deepEqual(
    textContentBytes(submission.evidence.rawEvidence.content),
    submittedBytes
  );
  assert.equal(
    submission.evidence.rawEvidence.rawEvidenceDigest,
    rawEvidenceDigest(submittedBytes)
  );
  assert.notEqual(
    submission.evidence.rawEvidence.rawEvidenceDigest,
    rawEvidenceDigest(parsed.canonicalBytes)
  );
});
