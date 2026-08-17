import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateMechanicalConformance,
} from "../../source/executables/orchestrator/index.mjs";
import {
  SchemaValidator,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

const digest = (label) =>
  hashCanonical("mechanical-conformance-test/v1", { label });

function roleEvidence(assignmentRef, roleClass, content) {
  return {
    assignmentRef,
    roleClass,
    roleEvidenceDigest: digest(`${assignmentRef}:${roleClass}`),
    hostIsolationAttestationDigest: digest(
      `${assignmentRef}:${roleClass}:isolation`,
    ),
    executionBoundary: "test_in_process_fixture",
    content,
    roleResult: { resultDigest: digest(`${assignmentRef}:${roleClass}:result`) },
    observableCapture: {
      captureDigest: digest(`${assignmentRef}:${roleClass}:capture`),
    },
    observableCaptureDigest: digest(
      `${assignmentRef}:${roleClass}:capture`,
    ),
  };
}

test("mechanical conformance production wiring", async (t) => {
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const assignmentId = "assignment-1";

  await t.test(
    "emits schema-valid pass evidence without semantic authority",
    () => {
      const result = evaluateMechanicalConformance({
        campaignId: "campaign-mechanical",
        assignments: [{ assignmentId }],
        subjectEvidence: [
          {
            assignmentRef: assignmentId,
            subjectExecutionDigest: digest("subject"),
            artifactRawSha256: digest("artifact"),
            terminalObservation: { terminalClass: "completed" },
          },
        ],
        surveyEvidence: [
          roleEvidence(assignmentId, "survey-executor", {
            artifact: { artifactId: "artifact-1" },
          }),
        ],
        downstreamEvidence: [
          roleEvidence(assignmentId, "downstream-consumer", {
            utility: { taskCompleted: true },
          }),
        ],
        schemaValidator,
      });
      assert.equal(result.passed, true);
      assert.equal(result.observations.length, 3);
      assert.equal(result.incidentObservations.length, 0);
      assert.equal(result.semanticJudgmentAuthority, false);
      assert.equal(result.exclusionAuthority, false);
    },
  );

  await t.test(
    "retains missing evidence as an incident rather than silently passing it",
    () => {
      const result = evaluateMechanicalConformance({
        campaignId: "campaign-mechanical",
        assignments: [{ assignmentId }],
        subjectEvidence: [],
        surveyEvidence: [
          roleEvidence(assignmentId, "survey-executor", {
            artifact: { artifactId: "artifact-1" },
          }),
        ],
        downstreamEvidence: [
          roleEvidence(assignmentId, "downstream-consumer", {
            utility: { taskCompleted: true },
          }),
        ],
        schemaValidator,
      });
      assert.equal(result.passed, false);
      assert.equal(result.incidentObservations.length, 1);
      assert.equal(
        result.incidentObservations[0].observationClass,
        "ambiguous",
      );
      assert.equal(
        result.incidentObservations[0].downstreamMetricEffects.every(
          (effect) => effect.effect === "unresolved",
        ),
        true,
      );
    },
  );
});
