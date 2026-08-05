import assert from "node:assert/strict";
import {
  createSurveyResourceResolver,
  surveyResourceSemanticDigest
} from "../../../source/authoring/survey/resource-semantics.mjs";
import {
  commitReceiptDigest
} from "../../../source/authoring/kernel/digests.mjs";
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
    "outcomeAxes",
    "policySnapshotRef",
    "surveyFrameRef"
  ]);
  assert.equal(survey.spec.surveyFrameRef.kind, "ContextFrame");
  assert.deepEqual(survey.spec.outcomeAxes, [
    "intent fidelity",
    "decision usefulness"
  ]);
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

async function exactRoundScopedJoins() {
  const [
    round,
    instrumentTemplate,
    responseTemplate,
    interpretationTemplate,
    closure
  ] = await Promise.all([
    loadPositiveFixture("survey-round-1"),
    loadPositiveFixture("round-instrument-1"),
    loadPositiveFixture("runtime-round-response-set"),
    loadPositiveFixture("round-interpretation-1"),
    loadAuthoringFixture("context-closure")
  ]);

  const instrument = structuredClone(instrumentTemplate);
  instrument.spec.roundRef = exactReference(round);
  const response = structuredClone(responseTemplate);
  response.spec.payload.roundRef = exactReference(round);
  response.spec.payload.instrumentRef = exactReference(instrument);
  const interpretation = structuredClone(interpretationTemplate);
  interpretation.spec.roundRef = exactReference(round);
  interpretation.spec.instrumentRef = exactReference(instrument);
  interpretation.spec.responseSetRef = exactReference(response);
  interpretation.spec.generationContextRef = exactReference(closure);
  const exactResolver = createSurveyResourceResolver([
    round,
    instrument,
    response,
    closure
  ]);
  for (const resource of [response, interpretation]) {
    const result = await validateSurveyResource(resource, {
      resolveReference: exactResolver
    });
    assert.equal(result.valid, true, JSON.stringify(result, null, 2));
  }

  const foreignRound = structuredClone(round);
  foreignRound.metadata.name = "foreign-round-1";
  foreignRound.spec.surveyRef = {
    ...foreignRound.spec.surveyRef,
    name: "foreign-survey"
  };
  const foreignInstrument = structuredClone(instrument);
  foreignInstrument.metadata.name = "foreign-round-1-instrument";
  foreignInstrument.spec.roundRef = exactReference(foreignRound);
  const crossedResponse = structuredClone(response);
  crossedResponse.spec.payload.instrumentRef =
    exactReference(foreignInstrument);
  const crossedResolver = createSurveyResourceResolver([
    round,
    foreignRound,
    foreignInstrument
  ]);
  const responseResult = await validateSurveyResource(crossedResponse, {
    resolveReference: crossedResolver
  });
  assert.equal(responseResult.valid, false);
  assert.equal(
    responseResult.semanticIssues.some(({ code }) => (
      code === "RESPONSE_SET_INSTRUMENT_ROUND_REFERENCE_MISMATCH"
    )),
    true,
    JSON.stringify(responseResult.semanticIssues, null, 2)
  );

  const crossedInterpretation = structuredClone(interpretation);
  crossedInterpretation.spec.instrumentRef =
    exactReference(foreignInstrument);
  crossedInterpretation.spec.responseSetRef = exactReference(crossedResponse);
  const interpretationResolver = createSurveyResourceResolver([
    round,
    foreignRound,
    foreignInstrument,
    crossedResponse,
    closure
  ]);
  const interpretationResult = await validateSurveyResource(
    crossedInterpretation,
    { resolveReference: interpretationResolver }
  );
  assert.equal(interpretationResult.valid, false);
  assert.equal(
    interpretationResult.semanticIssues.some(({ code }) => (
      code === "INTERPRETATION_INSTRUMENT_ROUND_REFERENCE_MISMATCH"
    )),
    true,
    JSON.stringify(interpretationResult.semanticIssues, null, 2)
  );

  const [roundTwoTemplate, priorTemplate] = await Promise.all([
    loadPositiveFixture("survey-round-2"),
    loadPositiveFixture("round-interpretation-1")
  ]);
  const foreignPrior = structuredClone(priorTemplate);
  foreignPrior.metadata.name = "foreign-round-1-interpretation";
  foreignPrior.spec.roundRef = exactReference(foreignRound);
  const roundTwo = structuredClone(roundTwoTemplate);
  roundTwo.spec.round1InterpretationRef = exactReference(foreignPrior);
  const priorResolver = createSurveyResourceResolver([
    foreignPrior,
    foreignRound
  ]);
  const priorResult = await validateSurveyResource(roundTwo, {
    resolveReference: priorResolver
  });
  assert.equal(
    priorResult.semanticIssues.some(({ code }) => (
      code === "ROUND_TWO_PRIOR_SURVEY_MISMATCH"
    )),
    true,
    JSON.stringify(priorResult.semanticIssues, null, 2)
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
    "authoring-commit-receipt",
    "authoring-mutation"
  ];
  const [
    request,
    assignment,
    submission,
    closure,
    receipt,
    mutation,
    roundOne,
    roundTwo,
    sourceSnapshot
  ] = await Promise.all([
    ...stems.map(loadAuthoringFixture),
    loadPositiveFixture("survey-round-1"),
    loadPositiveFixture("survey-round-2"),
    loadAuthoringFixture("source-snapshot")
  ]);
  const exactInputs = {
    round: exactReference(roundOne),
    source: exactReference(sourceSnapshot)
  };
  request.spec.operation.inputs = structuredClone(exactInputs);
  assignment.spec.request.reference = exactReference(request);
  submission.spec.assignment.reference = exactReference(assignment);
  receipt.spec.cause.assignment.reference = exactReference(assignment);
  receipt.spec.cause.submission.reference = exactReference(submission);
  const createdResource = structuredClone(
    mutation.spec.createdResources[0].resource
  );
  receipt.spec.createdResources = [exactReference(createdResource)];
  receipt.spec.receiptDigest = commitReceiptDigest(receipt);
  const generation = await loadPositiveFixture("generation-record");
  generation.spec.requestRef = exactReference(request);
  generation.spec.assignmentRef = exactReference(assignment);
  generation.spec.submissionRef = exactReference(submission);
  generation.spec.contextClosureRef = exactReference(closure);
  generation.spec.result.commitReceiptRef = exactReference(receipt);
  generation.spec.result.createdResourceRefs =
    structuredClone(receipt.spec.createdResources);
  generation.spec.ancestry.inputResourceRefs = Object.keys(exactInputs)
    .sort()
    .map((key) => structuredClone(exactInputs[key]));
  generation.spec.ancestry.priorGenerationRecordRefs = [];
  generation.spec.ancestry.revisionOfRefs = [];
  generation.spec.assessmentAncestryRefs = [
    exactReference(sourceSnapshot)
  ];
  const resolver = createSurveyResourceResolver([
    request,
    assignment,
    submission,
    closure,
    receipt,
    createdResource,
    roundOne,
    roundTwo,
    sourceSnapshot
  ]);
  const result = await validateSurveyResource(generation, {
    resolveReference: resolver
  });
  assert.equal(result.valid, true, JSON.stringify(result, null, 2));

  const missingCreatedResolver = createSurveyResourceResolver([
    request,
    assignment,
    submission,
    closure,
    receipt,
    roundOne,
    roundTwo,
    sourceSnapshot
  ]);
  const missingCreatedResult = await validateSurveyResource(generation, {
    resolveReference: missingCreatedResolver
  });
  assert.equal(missingCreatedResult.valid, false);
  assert.equal(
    missingCreatedResult.semanticIssues.some(
      ({ code, field }) =>
        code === "REFERENCE_UNRESOLVED" &&
        field === "/spec/result/createdResourceRefs/0"
    ),
    true,
    JSON.stringify(missingCreatedResult.semanticIssues, null, 2)
  );

  const invalidReceipt = structuredClone(receipt);
  invalidReceipt.spec.receiptDigest = `sha256:${"0".repeat(64)}`;
  const invalidReceiptGeneration = structuredClone(generation);
  invalidReceiptGeneration.spec.result.commitReceiptRef =
    exactReference(invalidReceipt);
  const invalidReceiptResolver = createSurveyResourceResolver([
    request,
    assignment,
    submission,
    closure,
    invalidReceipt,
    createdResource,
    roundOne,
    roundTwo,
    sourceSnapshot
  ]);
  const invalidReceiptResult = await validateSurveyResource(
    invalidReceiptGeneration,
    { resolveReference: invalidReceiptResolver }
  );
  assert.equal(invalidReceiptResult.valid, false);
  assert.equal(
    invalidReceiptResult.semanticIssues.some(
      ({ code }) => code === "COMMIT_RECEIPT_DIGEST_MISMATCH"
    ),
    true,
    JSON.stringify(invalidReceiptResult.semanticIssues, null, 2)
  );

  const unrelated = structuredClone(generation);
  unrelated.spec.ancestry.inputResourceRefs[0] = exactReference(roundTwo);
  const unrelatedResult = await validateSurveyResource(unrelated, {
    resolveReference: resolver
  });
  assert.equal(unrelatedResult.valid, false);
  assert.equal(
    unrelatedResult.semanticIssues.some(
      ({ code }) => code === "GENERATION_INPUT_ANCESTRY_MISMATCH"
    ),
    true,
    JSON.stringify(unrelatedResult.semanticIssues, null, 2)
  );

  const reordered = structuredClone(generation);
  reordered.spec.ancestry.inputResourceRefs.reverse();
  const reorderedResult = await validateSurveyResource(reordered, {
    resolveReference: resolver
  });
  assert.equal(reorderedResult.valid, false);
  assert.equal(
    reorderedResult.semanticIssues.some(
      ({ code }) => code === "GENERATION_INPUT_ANCESTRY_MISMATCH"
    ),
    true,
    JSON.stringify(reorderedResult.semanticIssues, null, 2)
  );

  const unresolved = structuredClone(generation);
  unresolved.spec.assessmentAncestryRefs[0].semanticDigest =
    `sha256:${"0".repeat(64)}`;
  const unresolvedResult = await validateSurveyResource(unresolved, {
    resolveReference: resolver
  });
  assert.equal(unresolvedResult.valid, false);
  assert.equal(
    unresolvedResult.semanticIssues.some(
      ({ code }) => code === "REFERENCE_UNRESOLVED"
    ),
    true,
    JSON.stringify(unresolvedResult.semanticIssues, null, 2)
  );

  const falseRevision = structuredClone(generation);
  falseRevision.spec.ancestry.revisionOfRefs = [exactReference(roundOne)];
  const falseRevisionResult = await validateSurveyResource(falseRevision, {
    resolveReference: resolver
  });
  assert.equal(falseRevisionResult.valid, false);
  assert.equal(
    falseRevisionResult.semanticIssues.some(
      ({ code }) => code === "GENERATION_TASK_REVISION_ANCESTRY_FORBIDDEN"
    ),
    true,
    JSON.stringify(falseRevisionResult.semanticIssues, null, 2)
  );

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
  "O-SV01-03": exactRoundScopedJoins,
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
