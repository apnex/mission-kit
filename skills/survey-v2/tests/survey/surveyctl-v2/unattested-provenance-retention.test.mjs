import assert from "node:assert/strict";
import test from "node:test";
import {
  readFile,
} from "node:fs/promises";
import {
  canonicalize,
  sha256Bytes,
  sha256Value,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createSurveyctlHarness,
  executeCommand,
  initializeHarness,
  readSession,
  runSurveyctlProcess,
  writeSurveyFrameInput,
} from "./support.mjs";

function onlyResource(workspace, kind) {
  const matches = workspace.spec.resourceVersions.filter(
    ({ resource }) => resource.kind === kind,
  );
  assert.equal(
    matches.length,
    1,
    `expected exactly one retained ${kind}`,
  );
  return matches[0].resource;
}

test(
  "surveyctl retains explicit unattested provenance without changing semantic products",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext, {
        slug: "unattested-provenance",
      }),
    );
    const issued = await executeCommand(harness, "next");
    const input = await writeSurveyFrameInput(
      harness,
      issued.result,
    );
    const submittedBytes = await readFile(input);
    const submitted = await runSurveyctlProcess([
      "submit",
      `--run=${harness.runDirectory}`,
      `--key-root=${harness.keyRoot}`,
      `--input=${input}`,
      "--format=text",
    ]);
    assert.equal(
      submitted.code,
      0,
      submitted.stderr.toString("utf8"),
    );

    const persisted = await readSession(harness);
    const workspace = persisted.authoring.workspace;
    const generationRecord = onlyResource(
      workspace,
      "GenerationRecord",
    );
    const retainedSubmission = onlyResource(
      workspace,
      "AuthoringSubmission",
    );
    const provenance =
      retainedSubmission.evidence.producerProvenance;
    const submittedBytesDigest =
      sha256Bytes(submittedBytes);
    const authorityDigest =
      sha256Value(persisted.authority);

    assert.equal(provenance.producerClass, "external");
    assert.equal(
      provenance.generation.provider,
      "unattested-external-input",
    );
    assert.equal(
      provenance.generation.model,
      "unreported",
    );
    assert.equal(
      provenance.generation.attemptId,
      `submission.${
        issued.result.assignment.spec.handle
      }.${
        submittedBytesDigest.slice(
          "sha256:".length,
          "sha256:".length + 16,
        )
      }`,
    );
    assert.equal(
      provenance.evidenceDigest,
      sha256Value({
        domain:
          "mission-kit:survey-v2:external-submission-evidence/v1",
        authorityDigest,
        requestDigest:
          issued.result.request.spec.requestDigest,
        submittedBytesDigest,
      }),
    );

    assert.deepEqual(
      generationRecord.evidence.producer,
      provenance.generation,
    );
    assert.deepEqual(
      generationRecord.spec.requestRef,
      resourceReferenceFrom(issued.result.request),
    );
    assert.deepEqual(
      generationRecord.spec.assignmentRef,
      resourceReferenceFrom(issued.result.assignment),
    );
    assert.deepEqual(
      generationRecord.spec.submissionRef,
      resourceReferenceFrom(retainedSubmission),
    );
    assert.deepEqual(
      generationRecord.spec.result.createdResourceRefs.map(
        ({ kind }) => kind,
      ),
      ["ContextFrame", "Survey"],
    );
    assert.equal(
      generationRecord.spec.result.createdResourceRefs.some(
        ({ kind }) => kind === "GenerationRecord",
      ),
      false,
    );
    assert.deepEqual(
      workspace.spec.activeHeads
        .filter(({ slot }) =>
          slot === "survey-frame" || slot === "survey")
        .map(({ reference }) => reference),
      generationRecord.spec.result.createdResourceRefs,
    );

    const changedTelemetry =
      structuredClone(retainedSubmission);
    changedTelemetry.evidence.producerProvenance.producerClass =
      "automation";
    changedTelemetry.evidence.producerProvenance.generation.provider =
      "different-untrusted-provider";
    changedTelemetry.evidence.producerProvenance.generation.model =
      "different-unreported-model";
    assert.equal(
      resourceSemanticDigest(changedTelemetry),
      resourceSemanticDigest(retainedSubmission),
    );
    assert.equal(
      canonicalize(
        generationRecord.spec.result.createdResourceRefs,
      ),
      canonicalize(
        workspace.spec.activeHeads
          .filter(({ slot }) =>
            slot === "survey-frame" ||
            slot === "survey")
          .map(({ reference }) => reference),
      ),
    );
  },
);
