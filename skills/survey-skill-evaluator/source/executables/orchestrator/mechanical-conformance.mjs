import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";

function byAssignment(records, label) {
  if (!Array.isArray(records)) {
    throw new ValidationError(`${label} must be an array`);
  }
  const indexed = new Map();
  for (const record of records) {
    if (
      !record ||
      typeof record.assignmentRef !== "string" ||
      indexed.has(record.assignmentRef)
    ) {
      throw new IntegrityError(`${label} has no unique assignment binding`);
    }
    indexed.set(record.assignmentRef, record);
  }
  return indexed;
}

function observation({
  campaignId,
  assignmentId,
  checkId,
  passed,
  observable,
  evidenceRefs,
}) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    conformanceObservationId:
      `${campaignId}:${assignmentId}:${checkId}`,
    sourceObjectId: assignmentId,
    checkId,
    result: observable ? (passed ? "pass" : "fail") : "not_observable",
    severity: "blocking",
    evidenceRefs: [...new Set(evidenceRefs)].sort(),
    affectedDimensionIds: [],
  };
}

/**
 * Runs only objective checks over already sealed evidence. It has no semantic
 * scoring, arm-selection, exclusion, retry, or recommendation authority.
 */
export function evaluateMechanicalConformance({
  campaignId,
  assignments,
  subjectEvidence,
  surveyEvidence,
  downstreamEvidence,
  schemaValidator,
}) {
  if (
    typeof campaignId !== "string" ||
    !Array.isArray(assignments) ||
    assignments.length === 0 ||
    !schemaValidator ||
    typeof schemaValidator.assert !== "function"
  ) {
    throw new ValidationError(
      "Mechanical conformance requires a campaign, assignment universe, and schema validator",
    );
  }
  const subjects = byAssignment(subjectEvidence, "Subject evidence");
  const surveys = byAssignment(surveyEvidence, "Survey role evidence");
  const downstream = byAssignment(
    downstreamEvidence,
    "Downstream role evidence",
  );
  const observations = [];
  for (const assignment of assignments) {
    const subject = subjects.get(assignment.assignmentId);
    const survey = surveys.get(assignment.assignmentId);
    const consumer = downstream.get(assignment.assignmentId);
    const terminalObservable =
      subject?.terminalObservation &&
      typeof subject.terminalObservation.terminalClass === "string";
    observations.push(
      observation({
        campaignId,
        assignmentId: assignment.assignmentId,
        checkId: "subject_terminal_protocol",
        observable: terminalObservable,
        passed:
          terminalObservable &&
          subject.terminalObservation.terminalClass === "completed" &&
          typeof subject.subjectExecutionDigest === "string" &&
          typeof subject.artifactRawSha256 === "string",
        evidenceRefs:
          typeof subject?.subjectExecutionDigest === "string"
            ? [subject.subjectExecutionDigest]
            : [],
      }),
    );
    const captureObservable = Boolean(
      survey?.roleResult &&
        consumer?.roleResult &&
        survey?.observableCapture &&
        consumer?.observableCapture &&
        survey?.content?.artifact &&
        consumer?.content?.utility,
    );
    observations.push(
      observation({
        campaignId,
        assignmentId: assignment.assignmentId,
        checkId: "observable_capture_complete",
        observable: captureObservable,
        passed:
          captureObservable &&
          typeof survey.roleResult.resultDigest === "string" &&
          typeof consumer.roleResult.resultDigest === "string" &&
          typeof survey.observableCaptureDigest === "string" &&
          typeof consumer.observableCaptureDigest === "string" &&
          typeof survey.roleEvidenceDigest === "string" &&
          typeof consumer.roleEvidenceDigest === "string",
        evidenceRefs: [
          survey?.roleEvidenceDigest,
          consumer?.roleEvidenceDigest,
          survey?.observableCaptureDigest,
          consumer?.observableCaptureDigest,
        ].filter((value) => typeof value === "string"),
      }),
    );
    const isolationObservable = Boolean(
      survey?.hostIsolationAttestationDigest &&
        consumer?.hostIsolationAttestationDigest,
    );
    observations.push(
      observation({
        campaignId,
        assignmentId: assignment.assignmentId,
        checkId: "role_isolation_attested",
        observable: isolationObservable,
        passed:
          isolationObservable &&
          typeof survey.executionBoundary === "string" &&
          typeof consumer.executionBoundary === "string",
        evidenceRefs: [
          survey?.hostIsolationAttestationDigest,
          consumer?.hostIsolationAttestationDigest,
        ].filter((value) => typeof value === "string"),
      }),
    );
  }
  for (const contract of observations) {
    schemaValidator.assert("conformance-observation", contract);
  }
  const incidentObservations = observations
    .filter((contract) => contract.result !== "pass")
    .map((contract) => {
      const incident = {
        schemaVersion: "1.0.0",
        hashProfileId: HASH_PROFILE_ID,
        incidentObservationId:
          `${contract.conformanceObservationId}:incident`,
        sourceObjectId: contract.sourceObjectId,
        observationClass:
          contract.result === "fail" ? "objective" : "ambiguous",
        incidentClass: contract.checkId,
        classificationEvidenceRefs: contract.evidenceRefs,
        downstreamMetricEffects: [
          {
            metricId: "SEMANTIC_INTENT_ATOMS",
            effect:
              contract.result === "fail"
                ? "candidate_adverse"
                : "unresolved",
          },
          {
            metricId: "DOWNSTREAM_UTILITY",
            effect:
              contract.result === "fail"
                ? "structural_missing"
                : "unresolved",
          },
        ],
      };
      schemaValidator.assert("incident-observation", incident);
      return incident;
    });
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    mechanicalConformanceId: `${campaignId}:mechanical-conformance`,
    campaignId,
    assignmentUniverseDigest: hashCanonical(
      "mechanical-conformance-assignment-universe/v1",
      assignments.map((assignment) => assignment.assignmentId).sort(),
    ),
    observations,
    incidentObservations,
    passed: incidentObservations.length === 0,
    semanticJudgmentAuthority: false,
    exclusionAuthority: false,
    retryAuthority: false,
    recommendationAuthority: false,
  };
  return deepFreeze({
    ...deepCloneCanonical(core),
    mechanicalConformanceDigest: hashCanonical(
      "mechanical-conformance/v1",
      core,
    ),
  });
}
