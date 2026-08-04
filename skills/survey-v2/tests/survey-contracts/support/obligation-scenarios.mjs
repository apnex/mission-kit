import assert from "node:assert/strict";
import {
  createSurveyResourceResolver,
  surveyResourceSemanticDigest
} from "../../../source/authoring/survey/resource-semantics.mjs";
import {
  assertNegativeFixture,
  assertPositiveFixture,
  loadAuthoringFixture,
  loadPositiveFixture,
  validateSurveyResource
} from "./contract-validation.mjs";

const RUNTIME_STEMS = Object.freeze([
  "runtime-round-response-set",
  "runtime-revision-directive",
  "runtime-candidate-validation-evidence",
  "runtime-finalization-diagnostic",
  "runtime-composite-runtime-evidence"
]);

function exactReference(resource) {
  return {
    apiVersion: resource.apiVersion,
    kind: resource.kind,
    name: resource.metadata.name,
    semanticDigest: surveyResourceSemanticDigest(resource)
  };
}

function sameReference(left, right) {
  assert.deepEqual(left, right);
}

async function surveyGeometry() {
  const [survey, policy] = await Promise.all([
    assertPositiveFixture("survey"),
    assertPositiveFixture("survey-policy-snapshot")
  ]);
  assert.deepEqual(Object.keys(survey.spec).sort(), [
    "policySnapshotRef",
    "surveyFrameRef"
  ]);
  assert.equal(survey.spec.surveyFrameRef.kind, "ContextFrame");
  assert.deepEqual(policy.spec.geometry, {
    rounds: 2,
    questionsPerRound: 3,
    totalQuestions: 6,
    choiceOptions: { minimum: 3, maximum: 4 }
  });
}

async function surveyRoundAncestry() {
  const [roundOne, roundTwo] = await Promise.all([
    assertPositiveFixture("survey-round-1"),
    assertPositiveFixture("survey-round-2")
  ]);
  assert.equal(roundOne.spec.ordinal, 1);
  assert.equal(roundOne.spec.role, "foundation");
  assert.equal(Object.hasOwn(roundOne.spec, "round1InterpretationRef"), false);
  sameReference(
    roundOne.spec.parentBinding.parentFrameRef,
    roundOne.spec.surveyFrameRef
  );
  assert.equal(roundTwo.spec.ordinal, 2);
  assert.equal(roundTwo.spec.role, "refinement");
  assert.equal(roundTwo.spec.round1InterpretationRef.kind, "RoundInterpretation");
  sameReference(
    roundTwo.spec.parentBinding.parentFrameRef,
    roundTwo.spec.surveyFrameRef
  );
}

async function frameSetCoordinationContainer() {
  const frameSet = await assertPositiveFixture("question-frame-set-1");
  assert.equal(frameSet.kind, "QuestionFrameSet");
  assert.notEqual(frameSet.kind, "ContextFrame");
  assert.equal(frameSet.spec.slots.length, 3);
  assert.equal(
    frameSet.spec.slots.every(
      (slot) => slot.contextFrameRef.kind === "ContextFrame"
    ),
    true
  );
  await assertNegativeFixture("question-frame-set-fourth-altitude");
}

async function childFrameBindings() {
  const frameSet = await assertPositiveFixture("question-frame-set-1");
  for (const slot of frameSet.spec.slots) {
    sameReference(slot.parentFrameRef, frameSet.spec.parentFrameRef);
    assert.match(slot.scopeRelation, /^(narrows|partitions|qualifies)$/);
    assert.match(slot.containmentRationale, /\S/);
  }
}

async function mismatchedParentRejected() {
  const { result } = await assertNegativeFixture(
    "question-frame-parent-mismatch"
  );
  const mismatch = result.semanticIssues.find(
    ({ code }) => code === "QUESTION_FRAME_PARENT_MISMATCH"
  );
  assert.deepEqual(Object.keys(mismatch).sort(), ["code", "field", "reason"]);
  assert.equal(mismatch.field, "/spec/slots/1/parentFrameRef");
}

async function exactFrameSlots() {
  const frameSet = await assertPositiveFixture("question-frame-set-1");
  assert.deepEqual(
    frameSet.spec.slots.map(({ slot, questionOrdinal }) => ({
      slot,
      questionOrdinal
    })),
    [
      { slot: 1, questionOrdinal: 1 },
      { slot: 2, questionOrdinal: 2 },
      { slot: 3, questionOrdinal: 3 }
    ]
  );
}

async function invalidFrameSlots() {
  await assertNegativeFixture("question-frame-slot-duplicate");
}

async function neutralQuestionBinding() {
  const binding = await assertPositiveFixture("survey-question-binding-1");
  assert.equal(binding.spec.questionRef.kind, "Question");
  assert.equal(binding.spec.questionFrameRef.kind, "ContextFrame");
  assert.deepEqual(Object.keys(binding.spec).sort(), [
    "frameSetRef",
    "questionFrameRef",
    "questionOrdinal",
    "questionRef",
    "roundRef",
    "slot"
  ]);
}

async function exactRoundInstrument() {
  const instrument = await assertPositiveFixture("round-instrument-1");
  assert.deepEqual(
    instrument.spec.units.map(({ slot, questionOrdinal }) => ({
      slot,
      questionOrdinal
    })),
    [
      { slot: 1, questionOrdinal: 1 },
      { slot: 2, questionOrdinal: 2 },
      { slot: 3, questionOrdinal: 3 }
    ]
  );
  for (const unit of instrument.spec.units) {
    assert.equal(unit.questionRef.kind, "Question");
    assert.equal(unit.bindingRef.kind, "SurveyQuestionBinding");
    assert.equal(unit.questionFrameRef.kind, "ContextFrame");
  }
}

async function incompleteInstrumentRejected() {
  await assertNegativeFixture("round-instrument-incomplete");
}

async function bindingRejectsInlineSurveyFields() {
  await assertPositiveFixture("survey-question-binding-1");
  await assertNegativeFixture("binding-inline-survey-fields");
}

async function roundOneForbidsPrior() {
  await assertNegativeFixture("round-one-prior-interpretation");
}

async function roundTwoRequiresPrior() {
  await assertNegativeFixture("round-two-missing-interpretation");
}

async function interpretationAncestry() {
  const [roundOne, roundTwo] = await Promise.all([
    assertPositiveFixture("round-interpretation-1"),
    assertPositiveFixture("round-interpretation-2")
  ]);
  assert.deepEqual(
    roundOne.spec.perQuestion.map((entry) => entry.questionOrdinal),
    [1, 2, 3]
  );
  assert.equal(
    Object.hasOwn(roundOne.spec, "priorRoundInterpretationRef"),
    false
  );
  assert.deepEqual(
    roundTwo.spec.perQuestion.map((entry) => entry.questionOrdinal),
    [4, 5, 6]
  );
  assert.equal(
    roundTwo.spec.priorRoundInterpretationRef.kind,
    "RoundInterpretation"
  );
}

async function rationaleTruthIsNotJudged() {
  const frameSet = await loadPositiveFixture("question-frame-set-1");
  frameSet.spec.coverageRationale = "x";
  frameSet.spec.orthogonalityRationale = "x";
  for (const slot of frameSet.spec.slots) {
    slot.containmentRationale = "x";
  }
  const result = await validateSurveyResource(frameSet);
  assert.equal(result.valid, true, JSON.stringify(result, null, 2));
  assert.deepEqual(result.semanticIssues, []);
}

async function immutableReferenceRuntimeInput() {
  const instrument = await assertPositiveFixture("round-instrument-1");
  assert.equal(
    instrument.spec.units.every(
      (unit) =>
        Object.keys(unit).every((key) => key.endsWith("Ref") ||
          ["slot", "questionOrdinal"].includes(key))
    ),
    true
  );
  await assertNegativeFixture("round-instrument-inline-question");
}

async function fixedSurveyPolicy() {
  const policy = await assertPositiveFixture("survey-policy-snapshot");
  assert.equal(policy.spec.disclosure.mode, "single-current-question");
  assert.equal(policy.spec.disclosure.siblingQuestionFramesVisible, false);
  assert.equal(policy.spec.disclosure.futureQuestionsVisible, false);
  assert.equal(policy.spec.validation.authority, "mechanical-only");
  assert.equal(policy.spec.contextSelection.preserveLayerRoles, true);
  assert.equal(policy.spec.contextSelection.allowInlineRuntimeState, false);
}

async function fiveRuntimeVariants() {
  const resources = await Promise.all(
    RUNTIME_STEMS.map(assertPositiveFixture)
  );
  assert.deepEqual(
    resources.map((item) => item.spec.artifactType).sort(),
    [
      "CandidateValidationEvidence",
      "CompositeRuntimeEvidence",
      "FinalizationDiagnostic",
      "RevisionDirective",
      "RoundResponseSet"
    ]
  );
  const unknown = structuredClone(resources[0]);
  unknown.spec.artifactType = "UnknownRuntimeArtifact";
  const result = await validateSurveyResource(unknown);
  assert.equal(result.valid, false);
  assert.notEqual(result.structuralErrors.length, 0);
}

async function runtimeSourceBindings() {
  const resources = await Promise.all(
    RUNTIME_STEMS.map(assertPositiveFixture)
  );
  for (const resource of resources) {
    assert.deepEqual(Object.keys(resource.spec.source).sort(), [
      "sourceDigest",
      "sourceEventId",
      "sourcePhaseTransitionId",
      "sourceSemanticRevision",
      "surveyRunId"
    ]);
  }
  await assertNegativeFixture("runtime-source-mismatch");
}

async function typedResponseIngress() {
  const [interpretation, wrongArtifact] = await Promise.all([
    loadPositiveFixture("round-interpretation-1"),
    loadPositiveFixture("runtime-revision-directive")
  ]);
  const result = await validateSurveyResource(interpretation, {
    resolveReference(reference) {
      return reference.kind === "SurveyRuntimeArtifact"
        ? wrongArtifact
        : undefined;
    }
  });
  assert.equal(result.valid, false);
  assert.equal(
    result.semanticIssues.some(
      ({ code }) => code === "INTERPRETATION_RESPONSE_ARTIFACT_TYPE"
    ),
    true,
    JSON.stringify(result.semanticIssues, null, 2)
  );
}

async function producerEvidenceNonidentity() {
  const baseline = await assertPositiveFixture("generation-record");
  const changed = structuredClone(baseline);
  changed.evidence.producer.attemptId = "attempt-2";
  changed.evidence.producer.provider = "different-provider";
  changed.evidence.producer.model = "different-model";
  changed.evidence.producer.telemetry.latencyMs = 999;
  assert.deepEqual(
    changed.spec.result.createdResourceRefs,
    baseline.spec.result.createdResourceRefs
  );
  assert.equal(
    surveyResourceSemanticDigest(changed),
    surveyResourceSemanticDigest(baseline)
  );
  const result = await validateSurveyResource(changed);
  assert.equal(result.valid, true, JSON.stringify(result, null, 2));
}

async function exactGenerationAncestry() {
  const stems = [
    "authoring-request",
    "authoring-assignment",
    "authoring-submission",
    "context-closure",
    "authoring-commit-receipt"
  ];
  const [request, assignment, submission, closure, receipt] =
    await Promise.all(stems.map(loadAuthoringFixture));
  const generation = await loadPositiveFixture("generation-record");
  generation.spec.requestRef = exactReference(request);
  generation.spec.assignmentRef = exactReference(assignment);
  generation.spec.submissionRef = exactReference(submission);
  generation.spec.contextClosureRef = exactReference(closure);
  generation.spec.result.commitReceiptRef = exactReference(receipt);
  generation.spec.result.createdResourceRefs =
    structuredClone(receipt.spec.createdResources);
  const resolver = createSurveyResourceResolver([
    request,
    assignment,
    submission,
    closure,
    receipt
  ]);
  const result = await validateSurveyResource(generation, {
    resolveReference: resolver
  });
  assert.equal(result.valid, true, JSON.stringify(result, null, 2));

  const versionOne = await loadPositiveFixture("survey");
  const versionTwo = structuredClone(versionOne);
  versionTwo.spec.surveyFrameRef.name = "survey-frame-v2";
  const versionOneRef = exactReference(versionOne);
  const versionTwoRef = exactReference(versionTwo);
  assert.equal(versionOne.metadata.name, versionTwo.metadata.name);
  assert.notEqual(
    versionOneRef.semanticDigest,
    versionTwoRef.semanticDigest
  );
  const versionResolver = createSurveyResourceResolver([
    versionOne,
    versionTwo
  ]);
  assert.equal(versionResolver(versionOneRef), versionOne);
  assert.equal(versionResolver(versionTwoRef), versionTwo);
  assert.throws(
    () => createSurveyResourceResolver([versionOne, versionOne]),
    /duplicate exact resource version/
  );
}

const SCENARIOS = Object.freeze({
  "O-SV01-01": surveyGeometry,
  "O-SV01-02": surveyRoundAncestry,
  "O-SV02-01": frameSetCoordinationContainer,
  "O-SV03-01": childFrameBindings,
  "O-SV03-02": mismatchedParentRejected,
  "O-SV04-01": exactFrameSlots,
  "O-SV04-02": invalidFrameSlots,
  "O-SV05-01": neutralQuestionBinding,
  "O-SV05-02": exactRoundInstrument,
  "O-SV05-03": incompleteInstrumentRejected,
  "O-SV06-01": bindingRejectsInlineSurveyFields,
  "O-SV07-01": roundOneForbidsPrior,
  "O-SV07-02": roundTwoRequiresPrior,
  "O-SV07-03": interpretationAncestry,
  "O-SV09-01": rationaleTruthIsNotJudged,
  "O-SV10-01": immutableReferenceRuntimeInput,
  "O-SV10-02": fixedSurveyPolicy,
  "O-SV13-01": fiveRuntimeVariants,
  "O-SV13-02": runtimeSourceBindings,
  "O-SV13-03": typedResponseIngress,
  "O-AS10-07": producerEvidenceNonidentity,
  "O-AS14-21": exactGenerationAncestry
});

export async function runObligationScenario(obligationId) {
  const scenario = SCENARIOS[obligationId];
  if (!scenario) throw new TypeError(`unknown obligation ${obligationId}`);
  await scenario();
}
