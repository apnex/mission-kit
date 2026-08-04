import { resourceSemanticDigest } from "../kernel/digests.mjs";

export const SURVEY_API_VERSION = "survey.mission-kit/v1alpha1";

export const SURVEY_RESOURCE_SCHEMA_IDS = Object.freeze({
  Survey: "urn:mission-kit:survey:schema:survey:v1alpha1",
  SurveyRound: "urn:mission-kit:survey:schema:survey-round:v1alpha1",
  QuestionFrameSet: "urn:mission-kit:survey:schema:question-frame-set:v1alpha1",
  SurveyQuestionBinding:
    "urn:mission-kit:survey:schema:survey-question-binding:v1alpha1",
  RoundInstrument:
    "urn:mission-kit:survey:schema:round-instrument:v1alpha1",
  RoundInterpretation:
    "urn:mission-kit:survey:schema:round-interpretation:v1alpha1",
  SurveyPolicySnapshot:
    "urn:mission-kit:survey:schema:survey-policy-snapshot:v1alpha1",
  SurveyRuntimeArtifact:
    "urn:mission-kit:survey:schema:survey-runtime-artifact:v1alpha1",
  GenerationRecord:
    "urn:mission-kit:survey:schema:generation-record:v1alpha1"
});

const SURVEY_KINDS = new Set(Object.keys(SURVEY_RESOURCE_SCHEMA_IDS));
const ROUND_ORDINALS = Object.freeze({
  1: Object.freeze([1, 2, 3]),
  2: Object.freeze([4, 5, 6])
});

const RUNTIME_SOURCE_EDGES = Object.freeze({
  RoundResponseSet: Object.freeze([
    Object.freeze(["T10", "RESPOND_Q3"]),
    Object.freeze(["T21", "RESPOND_Q6"])
  ]),
  RevisionDirective: Object.freeze([
    Object.freeze(["T32", "DIRECTOR_RETURN"])
  ]),
  CandidateValidationEvidence: Object.freeze([
    Object.freeze(["T27", "CANDIDATE_VALIDATION_FAIL"])
  ]),
  FinalizationDiagnostic: Object.freeze([
    Object.freeze(["T38", "FINALIZATION_INVALIDATES_CANDIDATE"]),
    Object.freeze(["T40", "FINALIZATION_INVALIDATES_R2"])
  ]),
  CompositeRuntimeEvidence: Object.freeze([
    Object.freeze(["T24", "BEGIN_COMPOSITE"])
  ])
});

function issue(code, field, reason) {
  return Object.freeze({ code, field, reason });
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function referenceIdentity(reference) {
  return [
    reference?.apiVersion,
    reference?.kind,
    reference?.name,
    reference?.semanticDigest
  ].join("\u0000");
}

function sameReference(left, right) {
  return referenceIdentity(left) === referenceIdentity(right);
}

function referenceArrayEqual(left, right) {
  const leftKeys = array(left).map(referenceIdentity);
  const rightKeys = array(right).map(referenceIdentity);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index])
  );
}

function duplicateIssues(items, path, identity, code, noun) {
  const issues = [];
  const seen = new Set();
  array(items).forEach((item, index) => {
    const key = identity(item);
    if (seen.has(key)) {
      issues.push(issue(
        code,
        `${path}/${index}`,
        `${noun} must be unique within its ordered collection.`
      ));
    }
    seen.add(key);
  });
  return issues;
}

function expectedQuestionOrdinals(roundOrdinal) {
  return ROUND_ORDINALS[roundOrdinal] ?? [];
}

function orderedRoundUnitIssues(items, roundOrdinal, path, label) {
  const issues = [];
  const expected = expectedQuestionOrdinals(roundOrdinal);
  array(items).forEach((item, index) => {
    if (item?.slot !== index + 1) {
      issues.push(issue(
        `${label}_SLOT_ORDER`,
        `${path}/${index}/slot`,
        `${label} slot must equal its one-based array position.`
      ));
    }
    if (item?.questionOrdinal !== expected[index]) {
      issues.push(issue(
        `${label}_QUESTION_ORDER`,
        `${path}/${index}/questionOrdinal`,
        `${label} question ordinal must match its Round and array position.`
      ));
    }
  });
  return issues;
}

function refMismatch(code, path, message, actual, expected) {
  return sameReference(actual, expected)
    ? []
    : [issue(code, path, message)];
}

function resolveReference(reference, path, resolver, expectedKind) {
  if (typeof resolver !== "function") return { issues: [], resource: null };
  let resource;
  try {
    resource = resolver(reference);
  } catch (error) {
    return {
      issues: [issue(
        "REFERENCE_RESOLUTION_FAILED",
        path,
        `Reference resolver failed: ${error.message}`
      )],
      resource: null
    };
  }
  if (!resource) {
    return {
      issues: [issue(
        "REFERENCE_UNRESOLVED",
        path,
        "Exact resource reference does not resolve."
      )],
      resource: null
    };
  }
  const issues = [];
  if (
    resource.apiVersion !== reference?.apiVersion ||
    resource.kind !== reference?.kind ||
    resource.metadata?.name !== reference?.name
  ) {
    issues.push(issue(
      "REFERENCE_IDENTITY_MISMATCH",
      path,
      "Resolved resource identity differs from the exact reference."
    ));
  }
  if (expectedKind && resource.kind !== expectedKind) {
    issues.push(issue(
      "REFERENCE_KIND_MISMATCH",
      `${path}/kind`,
      `Resolved resource must have kind ${expectedKind}.`
    ));
  }
  try {
    if (resourceSemanticDigest(resource) !== reference?.semanticDigest) {
      issues.push(issue(
        "REFERENCE_DIGEST_MISMATCH",
        `${path}/semanticDigest`,
        "Resolved resource semantic digest differs from the exact reference."
      ));
    }
  } catch (error) {
    issues.push(issue(
      "REFERENCE_DIGEST_UNAVAILABLE",
      path,
      `Resolved resource semantic digest cannot be derived: ${error.message}`
    ));
  }
  return { issues, resource };
}

function validateSurvey(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  issues.push(
    ...resolveReference(
      spec.policySnapshotRef,
      "/spec/policySnapshotRef",
      resolver,
      "SurveyPolicySnapshot"
    ).issues,
    ...resolveReference(
      spec.surveyFrameRef,
      "/spec/surveyFrameRef",
      resolver,
      "ContextFrame"
    ).issues
  );
  return issues;
}

function validateSurveyRound(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  const isRoundOne = spec.ordinal === 1;
  const expectedRole = isRoundOne ? "foundation" : "refinement";

  if (spec.role !== expectedRole) {
    issues.push(issue(
      "ROUND_ROLE_MISMATCH",
      "/spec/role",
      `Round ${String(spec.ordinal)} must use role ${expectedRole}.`
    ));
  }
  if (isRoundOne && Object.hasOwn(spec, "round1InterpretationRef")) {
    issues.push(issue(
      "ROUND_ONE_PRIOR_INTERPRETATION",
      "/spec/round1InterpretationRef",
      "Round 1 cannot depend on a prior Round-1 interpretation."
    ));
  }
  if (spec.ordinal === 2 && !Object.hasOwn(spec, "round1InterpretationRef")) {
    issues.push(issue(
      "ROUND_TWO_INTERPRETATION_REQUIRED",
      "/spec/round1InterpretationRef",
      "Round 2 requires the exact sealed Round-1 interpretation."
    ));
  }
  issues.push(...refMismatch(
    "ROUND_PARENT_BINDING_MISMATCH",
    "/spec/parentBinding/parentFrameRef",
    "Round parent binding must equal the exact Survey ContextFrame reference.",
    spec.parentBinding?.parentFrameRef,
    spec.surveyFrameRef
  ));

  const surveyResolution = resolveReference(
    spec.surveyRef,
    "/spec/surveyRef",
    resolver,
    "Survey"
  );
  issues.push(...surveyResolution.issues);
  if (surveyResolution.resource) {
    issues.push(...refMismatch(
      "ROUND_SURVEY_FRAME_MISMATCH",
      "/spec/surveyFrameRef",
      "SurveyRound must bind the Survey's exact active ContextFrame.",
      spec.surveyFrameRef,
      surveyResolution.resource.spec?.surveyFrameRef
    ));
  }
  issues.push(
    ...resolveReference(
      spec.surveyFrameRef,
      "/spec/surveyFrameRef",
      resolver,
      "ContextFrame"
    ).issues,
    ...resolveReference(
      spec.roundFrameRef,
      "/spec/roundFrameRef",
      resolver,
      "ContextFrame"
    ).issues
  );
  if (spec.ordinal === 2) {
    const prior = resolveReference(
      spec.round1InterpretationRef,
      "/spec/round1InterpretationRef",
      resolver,
      "RoundInterpretation"
    );
    issues.push(...prior.issues);
    if (prior.resource && prior.resource.spec?.roundOrdinal !== 1) {
      issues.push(issue(
        "ROUND_TWO_PRIOR_NOT_ROUND_ONE",
        "/spec/round1InterpretationRef",
        "Round 2 ancestry must resolve to a Round-1 interpretation."
      ));
    }
  }
  return issues;
}

function validateQuestionFrameSet(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  const slots = array(spec.slots);
  issues.push(
    ...orderedRoundUnitIssues(
      slots,
      spec.roundOrdinal,
      "/spec/slots",
      "FRAME"
    ),
    ...duplicateIssues(
      slots,
      "/spec/slots",
      (slot) => slot?.slot,
      "FRAME_SLOT_DUPLICATE",
      "QuestionFrame slot"
    ),
    ...duplicateIssues(
      slots,
      "/spec/slots",
      (slot) => referenceIdentity(slot?.contextFrameRef),
      "QUESTION_FRAME_DUPLICATE",
      "Question ContextFrame reference"
    )
  );

  slots.forEach((slot, index) => {
    issues.push(...refMismatch(
      "QUESTION_FRAME_PARENT_MISMATCH",
      `/spec/slots/${index}/parentFrameRef`,
      "Every Question ContextFrame binding must name the exact Round parent.",
      slot?.parentFrameRef,
      spec.parentFrameRef
    ));
    issues.push(...duplicateIssues(
      slot?.outcomeAxisAnchors,
      `/spec/slots/${index}/outcomeAxisAnchors`,
      (anchor) => anchor?.axis,
      "AXIS_ANCHOR_DUPLICATE",
      "Outcome-axis anchor"
    ));
    issues.push(...duplicateIssues(
      slot?.sourceEvidenceRefs,
      `/spec/slots/${index}/sourceEvidenceRefs`,
      referenceIdentity,
      "SOURCE_EVIDENCE_DUPLICATE",
      "Source-evidence reference"
    ));
    if (spec.roundOrdinal === 1 && Object.hasOwn(object(slot), "round1Relation")) {
      issues.push(issue(
        "ROUND_ONE_RELATION_FORBIDDEN",
        `/spec/slots/${index}/round1Relation`,
        "Round-1 QuestionFrames cannot declare a relationship to prior Round-1 meaning."
      ));
    }
    if (spec.roundOrdinal === 2 && !Object.hasOwn(object(slot), "round1Relation")) {
      issues.push(issue(
        "ROUND_TWO_RELATION_REQUIRED",
        `/spec/slots/${index}/round1Relation`,
        "Every Round-2 QuestionFrame must declare its relationship to sealed Round-1 meaning."
      ));
    }
    issues.push(...resolveReference(
      slot?.contextFrameRef,
      `/spec/slots/${index}/contextFrameRef`,
      resolver,
      "ContextFrame"
    ).issues);
  });

  const roundResolution = resolveReference(
    spec.roundRef,
    "/spec/roundRef",
    resolver,
    "SurveyRound"
  );
  issues.push(...roundResolution.issues);
  if (roundResolution.resource) {
    if (roundResolution.resource.spec?.ordinal !== spec.roundOrdinal) {
      issues.push(issue(
        "FRAME_SET_ROUND_ORDINAL_MISMATCH",
        "/spec/roundOrdinal",
        "QuestionFrameSet Round ordinal differs from its referenced SurveyRound."
      ));
    }
    issues.push(...refMismatch(
      "FRAME_SET_PARENT_MISMATCH",
      "/spec/parentFrameRef",
      "QuestionFrameSet parent must be the referenced Round ContextFrame.",
      spec.parentFrameRef,
      roundResolution.resource.spec?.roundFrameRef
    ));
    if (spec.roundOrdinal === 2) {
      slots.forEach((slot, index) => {
        issues.push(...refMismatch(
          "ROUND_TWO_RELATION_ANCESTRY_MISMATCH",
          `/spec/slots/${index}/round1Relation/interpretationRef`,
          "Round-2 QuestionFrame relationship must bind the Round's exact sealed Round-1 interpretation.",
          slot?.round1Relation?.interpretationRef,
          roundResolution.resource.spec?.round1InterpretationRef
        ));
      });
    }
  }
  issues.push(...resolveReference(
    spec.parentFrameRef,
    "/spec/parentFrameRef",
    resolver,
    "ContextFrame"
  ).issues);
  return issues;
}

function validateSurveyQuestionBinding(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  const frameSetResolution = resolveReference(
    spec.frameSetRef,
    "/spec/frameSetRef",
    resolver,
    "QuestionFrameSet"
  );
  issues.push(...frameSetResolution.issues);
  if (frameSetResolution.resource) {
    const slot = array(frameSetResolution.resource.spec?.slots)
      .find((candidate) => candidate?.slot === spec.slot);
    if (!slot) {
      issues.push(issue(
        "BINDING_FRAME_SLOT_MISSING",
        "/spec/slot",
        "Question binding slot is absent from the frozen QuestionFrameSet."
      ));
    } else {
      if (slot.questionOrdinal !== spec.questionOrdinal) {
        issues.push(issue(
          "BINDING_QUESTION_ORDINAL_MISMATCH",
          "/spec/questionOrdinal",
          "Question binding ordinal differs from its frozen frame slot."
        ));
      }
      issues.push(...refMismatch(
        "BINDING_QUESTION_FRAME_MISMATCH",
        "/spec/questionFrameRef",
        "Question binding must use the exact ContextFrame in its frozen slot.",
        spec.questionFrameRef,
        slot.contextFrameRef
      ));
    }
    issues.push(...refMismatch(
      "BINDING_ROUND_MISMATCH",
      "/spec/roundRef",
      "Question binding must use its frame set's exact SurveyRound.",
      spec.roundRef,
      frameSetResolution.resource.spec?.roundRef
    ));
  }
  issues.push(
    ...resolveReference(
      spec.roundRef,
      "/spec/roundRef",
      resolver,
      "SurveyRound"
    ).issues,
    ...resolveReference(
      spec.questionFrameRef,
      "/spec/questionFrameRef",
      resolver,
      "ContextFrame"
    ).issues,
    ...resolveReference(
      spec.questionRef,
      "/spec/questionRef",
      resolver,
      "Question"
    ).issues
  );
  return issues;
}

function validateRoundInstrument(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  const units = array(spec.units);
  issues.push(
    ...orderedRoundUnitIssues(
      units,
      spec.roundOrdinal,
      "/spec/units",
      "INSTRUMENT"
    ),
    ...duplicateIssues(
      units,
      "/spec/units",
      (unit) => referenceIdentity(unit?.bindingRef),
      "INSTRUMENT_BINDING_DUPLICATE",
      "Instrument binding"
    ),
    ...duplicateIssues(
      units,
      "/spec/units",
      (unit) => referenceIdentity(unit?.questionRef),
      "INSTRUMENT_QUESTION_DUPLICATE",
      "Instrument Question"
    )
  );
  const roundResolution = resolveReference(
    spec.roundRef,
    "/spec/roundRef",
    resolver,
    "SurveyRound"
  );
  const frameSetResolution = resolveReference(
    spec.frameSetRef,
    "/spec/frameSetRef",
    resolver,
    "QuestionFrameSet"
  );
  issues.push(...roundResolution.issues, ...frameSetResolution.issues);
  if (
    roundResolution.resource &&
    roundResolution.resource.spec?.ordinal !== spec.roundOrdinal
  ) {
    issues.push(issue(
      "INSTRUMENT_ROUND_ORDINAL_MISMATCH",
      "/spec/roundOrdinal",
      "RoundInstrument ordinal differs from its referenced SurveyRound."
    ));
  }
  if (frameSetResolution.resource) {
    issues.push(...refMismatch(
      "INSTRUMENT_FRAME_SET_ROUND_MISMATCH",
      "/spec/frameSetRef",
      "RoundInstrument frame set belongs to a different SurveyRound.",
      frameSetResolution.resource.spec?.roundRef,
      spec.roundRef
    ));
    units.forEach((unit, index) => {
      const frameSlot = array(frameSetResolution.resource.spec?.slots)
        .find((candidate) => candidate?.slot === unit?.slot);
      if (!frameSlot) {
        issues.push(issue(
          "INSTRUMENT_FRAME_SLOT_MISSING",
          `/spec/units/${index}/slot`,
          "RoundInstrument unit has no matching frozen QuestionFrame slot."
        ));
      } else {
        if (frameSlot.questionOrdinal !== unit?.questionOrdinal) {
          issues.push(issue(
            "INSTRUMENT_FRAME_ORDINAL_MISMATCH",
            `/spec/units/${index}/questionOrdinal`,
            "RoundInstrument Question ordinal differs from its frame slot."
          ));
        }
        issues.push(...refMismatch(
          "INSTRUMENT_FRAME_MISMATCH",
          `/spec/units/${index}/questionFrameRef`,
          "RoundInstrument unit must bind the exact frozen Question ContextFrame.",
          unit?.questionFrameRef,
          frameSlot.contextFrameRef
        ));
      }
    });
  }
  units.forEach((unit, index) => {
    const bindingResolution = resolveReference(
      unit?.bindingRef,
      `/spec/units/${index}/bindingRef`,
      resolver,
      "SurveyQuestionBinding"
    );
    issues.push(...bindingResolution.issues);
    if (bindingResolution.resource) {
      const binding = bindingResolution.resource.spec;
      for (const [field, code] of [
        ["questionRef", "INSTRUMENT_BINDING_QUESTION_MISMATCH"],
        ["questionFrameRef", "INSTRUMENT_BINDING_FRAME_MISMATCH"]
      ]) {
        issues.push(...refMismatch(
          code,
          `/spec/units/${index}/${field}`,
          `RoundInstrument ${field} differs from its exact binding.`,
          unit?.[field],
          binding?.[field]
        ));
      }
      if (
        binding?.slot !== unit?.slot ||
        binding?.questionOrdinal !== unit?.questionOrdinal
      ) {
        issues.push(issue(
          "INSTRUMENT_BINDING_POSITION_MISMATCH",
          `/spec/units/${index}`,
          "RoundInstrument unit position differs from its exact binding."
        ));
      }
      issues.push(
        ...refMismatch(
          "INSTRUMENT_BINDING_SET_MISMATCH",
          `/spec/units/${index}/bindingRef`,
          "RoundInstrument binding belongs to another QuestionFrameSet.",
          binding?.frameSetRef,
          spec.frameSetRef
        ),
        ...refMismatch(
          "INSTRUMENT_BINDING_ROUND_MISMATCH",
          `/spec/units/${index}/bindingRef`,
          "RoundInstrument binding belongs to another SurveyRound.",
          binding?.roundRef,
          spec.roundRef
        )
      );
    }
    issues.push(
      ...resolveReference(
        unit?.questionFrameRef,
        `/spec/units/${index}/questionFrameRef`,
        resolver,
        "ContextFrame"
      ).issues,
      ...resolveReference(
        unit?.questionRef,
        `/spec/units/${index}/questionRef`,
        resolver,
        "Question"
      ).issues
    );
  });
  issues.push(
    ...resolveReference(
      spec.policySnapshotRef,
      "/spec/policySnapshotRef",
      resolver,
      "SurveyPolicySnapshot"
    ).issues,
    ...resolveReference(
      spec.generationContextRef,
      "/spec/generationContextRef",
      resolver,
      "ContextClosure"
    ).issues
  );
  return issues;
}

function validateRoundInterpretation(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  const perQuestion = array(spec.perQuestion);
  issues.push(
    ...orderedRoundUnitIssues(
      perQuestion.map((entry, index) => ({ ...entry, slot: index + 1 })),
      spec.roundOrdinal,
      "/spec/perQuestion",
      "INTERPRETATION"
    ),
    ...duplicateIssues(
      perQuestion,
      "/spec/perQuestion",
      (entry) => referenceIdentity(entry?.questionRef),
      "INTERPRETATION_QUESTION_DUPLICATE",
      "Interpreted Question"
    ),
    ...duplicateIssues(
      spec.axisMapping,
      "/spec/axisMapping",
      (mapping) => mapping?.axis,
      "INTERPRETATION_AXIS_DUPLICATE",
      "Aggregate axis mapping"
    )
  );
  if (
    spec.roundOrdinal === 1 &&
    Object.hasOwn(spec, "priorRoundInterpretationRef")
  ) {
    issues.push(issue(
      "INTERPRETATION_ROUND_ONE_PRIOR_FORBIDDEN",
      "/spec/priorRoundInterpretationRef",
      "Round-1 interpretation cannot depend on a prior Round interpretation."
    ));
  }
  if (
    spec.roundOrdinal === 2 &&
    !Object.hasOwn(spec, "priorRoundInterpretationRef")
  ) {
    issues.push(issue(
      "INTERPRETATION_ROUND_TWO_PRIOR_REQUIRED",
      "/spec/priorRoundInterpretationRef",
      "Round-2 interpretation requires the exact sealed Round-1 interpretation."
    ));
  }
  const roundResolution = resolveReference(
    spec.roundRef,
    "/spec/roundRef",
    resolver,
    "SurveyRound"
  );
  const instrumentResolution = resolveReference(
    spec.instrumentRef,
    "/spec/instrumentRef",
    resolver,
    "RoundInstrument"
  );
  const responseResolution = resolveReference(
    spec.responseSetRef,
    "/spec/responseSetRef",
    resolver,
    "SurveyRuntimeArtifact"
  );
  issues.push(
    ...roundResolution.issues,
    ...instrumentResolution.issues,
    ...responseResolution.issues
  );
  if (
    roundResolution.resource &&
    roundResolution.resource.spec?.ordinal !== spec.roundOrdinal
  ) {
    issues.push(issue(
      "INTERPRETATION_ROUND_ORDINAL_MISMATCH",
      "/spec/roundOrdinal",
      "RoundInterpretation ordinal differs from its referenced SurveyRound."
    ));
  }
  if (instrumentResolution.resource) {
    const instrument = instrumentResolution.resource.spec;
    if (instrument.roundOrdinal !== spec.roundOrdinal) {
      issues.push(issue(
        "INTERPRETATION_INSTRUMENT_ROUND_MISMATCH",
        "/spec/instrumentRef",
        "RoundInterpretation instrument belongs to another Round."
      ));
    }
    perQuestion.forEach((entry, index) => {
      issues.push(...refMismatch(
        "INTERPRETATION_QUESTION_MISMATCH",
        `/spec/perQuestion/${index}/questionRef`,
        "Per-question interpretation must bind the instrument's exact Question.",
        entry?.questionRef,
        instrument.units?.[index]?.questionRef
      ));
    });
  }
  if (responseResolution.resource) {
    if (responseResolution.resource.spec?.artifactType !== "RoundResponseSet") {
      issues.push(issue(
        "INTERPRETATION_RESPONSE_ARTIFACT_TYPE",
        "/spec/responseSetRef",
        "RoundInterpretation runtime ingress must be a typed RoundResponseSet."
      ));
    } else {
      issues.push(
        ...refMismatch(
          "INTERPRETATION_RESPONSE_ROUND_MISMATCH",
          "/spec/responseSetRef",
          "RoundResponseSet belongs to another SurveyRound.",
          responseResolution.resource.spec?.payload?.roundRef,
          spec.roundRef
        ),
        ...refMismatch(
          "INTERPRETATION_RESPONSE_INSTRUMENT_MISMATCH",
          "/spec/responseSetRef",
          "RoundResponseSet belongs to another RoundInstrument.",
          responseResolution.resource.spec?.payload?.instrumentRef,
          spec.instrumentRef
        )
      );
    }
  }
  if (spec.roundOrdinal === 2) {
    const prior = resolveReference(
      spec.priorRoundInterpretationRef,
      "/spec/priorRoundInterpretationRef",
      resolver,
      "RoundInterpretation"
    );
    issues.push(...prior.issues);
    if (prior.resource && prior.resource.spec?.roundOrdinal !== 1) {
      issues.push(issue(
        "INTERPRETATION_PRIOR_NOT_ROUND_ONE",
        "/spec/priorRoundInterpretationRef",
        "Round-2 interpretation prior ancestry must resolve to Round 1."
      ));
    }
    if (roundResolution.resource) {
      issues.push(...refMismatch(
        "INTERPRETATION_ROUND_ANCESTRY_MISMATCH",
        "/spec/priorRoundInterpretationRef",
        "Round-2 interpretation must use its SurveyRound's exact Round-1 ancestry.",
        spec.priorRoundInterpretationRef,
        roundResolution.resource.spec?.round1InterpretationRef
      ));
    }
  }
  issues.push(...resolveReference(
    spec.generationContextRef,
    "/spec/generationContextRef",
    resolver,
    "ContextClosure"
  ).issues);
  return issues;
}

function validateSurveyPolicySnapshot(resource) {
  const issues = [];
  const spec = object(resource.spec);
  for (const [collection, path] of [
    [spec.validation?.schemaBindings, "/spec/validation/schemaBindings"],
    [spec.validation?.validatorBindings, "/spec/validation/validatorBindings"],
    [spec.contextSelection?.selectors, "/spec/contextSelection/selectors"]
  ]) {
    issues.push(...duplicateIssues(
      collection,
      path,
      (binding) => binding?.id,
      "POLICY_BINDING_DUPLICATE",
      "Policy binding"
    ));
  }
  return issues;
}

function validateRuntimeSource(spec) {
  const source = object(spec.source);
  const allowed = RUNTIME_SOURCE_EDGES[spec.artifactType] ?? [];
  if (
    !allowed.some(
      ([transitionId, eventId]) =>
        transitionId === source.sourcePhaseTransitionId &&
        eventId === source.sourceEventId
    )
  ) {
    return [issue(
      "RUNTIME_SOURCE_EDGE_MISMATCH",
      "/spec/source",
      "Runtime artifact discriminator is incompatible with its source phase transition and event."
    )];
  }
  return [];
}

function validateSurveyRuntimeArtifact(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  issues.push(...validateRuntimeSource(spec));
  if (spec.artifactType === "RoundResponseSet") {
    const payload = object(spec.payload);
    const responses = array(payload.responses);
    issues.push(
      ...orderedRoundUnitIssues(
        responses,
        payload.roundOrdinal,
        "/spec/payload/responses",
        "RESPONSE"
      ),
      ...duplicateIssues(
        responses,
        "/spec/payload/responses",
        (response) => referenceIdentity(response?.questionRef),
        "RESPONSE_QUESTION_DUPLICATE",
        "Round response Question"
      ),
      ...duplicateIssues(
        responses,
        "/spec/payload/responses",
        (response) => referenceIdentity(response?.bindingRef),
        "RESPONSE_BINDING_DUPLICATE",
        "Round response binding"
      )
    );
    const roundResolution = resolveReference(
      payload.roundRef,
      "/spec/payload/roundRef",
      resolver,
      "SurveyRound"
    );
    const instrumentResolution = resolveReference(
      payload.instrumentRef,
      "/spec/payload/instrumentRef",
      resolver,
      "RoundInstrument"
    );
    issues.push(...roundResolution.issues, ...instrumentResolution.issues);
    if (
      roundResolution.resource &&
      roundResolution.resource.spec?.ordinal !== payload.roundOrdinal
    ) {
      issues.push(issue(
        "RESPONSE_SET_ROUND_ORDINAL_MISMATCH",
        "/spec/payload/roundOrdinal",
        "RoundResponseSet ordinal differs from its referenced SurveyRound."
      ));
    }
    if (instrumentResolution.resource) {
      responses.forEach((response, index) => {
        const unit = instrumentResolution.resource.spec?.units?.[index];
        issues.push(
          ...refMismatch(
            "RESPONSE_SET_QUESTION_MISMATCH",
            `/spec/payload/responses/${index}/questionRef`,
            "Response must bind the instrument's exact Question.",
            response?.questionRef,
            unit?.questionRef
          ),
          ...refMismatch(
            "RESPONSE_SET_BINDING_MISMATCH",
            `/spec/payload/responses/${index}/bindingRef`,
            "Response must bind the instrument's exact SurveyQuestionBinding.",
            response?.bindingRef,
            unit?.bindingRef
          )
        );
      });
    }
  } else if (spec.artifactType === "CandidateValidationEvidence") {
    issues.push(...duplicateIssues(
      spec.payload?.validatorBindings,
      "/spec/payload/validatorBindings",
      (binding) => binding?.id,
      "RUNTIME_VALIDATOR_BINDING_DUPLICATE",
      "Runtime validator binding"
    ));
  } else if (spec.artifactType === "CompositeRuntimeEvidence") {
    for (const field of [
      "methodologyRefs",
      "authorityRefs",
      "dependencyRefs",
      "runtimeRefs"
    ]) {
      issues.push(...duplicateIssues(
        spec.payload?.[field],
        `/spec/payload/${field}`,
        referenceIdentity,
        "COMPOSITE_EVIDENCE_REFERENCE_DUPLICATE",
        "Composite evidence reference"
      ));
    }
  }
  return issues;
}

function validateGenerationRecord(resource, resolver) {
  const issues = [];
  const spec = object(resource.spec);
  for (const [items, path, code, noun] of [
    [
      spec.result?.createdResourceRefs,
      "/spec/result/createdResourceRefs",
      "GENERATION_RESULT_DUPLICATE",
      "Created resource"
    ],
    [
      spec.ancestry?.inputResourceRefs,
      "/spec/ancestry/inputResourceRefs",
      "GENERATION_INPUT_DUPLICATE",
      "Input resource"
    ],
    [
      spec.ancestry?.priorGenerationRecordRefs,
      "/spec/ancestry/priorGenerationRecordRefs",
      "GENERATION_PRIOR_DUPLICATE",
      "Prior GenerationRecord"
    ],
    [
      spec.ancestry?.revisionOfRefs,
      "/spec/ancestry/revisionOfRefs",
      "GENERATION_REVISION_DUPLICATE",
      "Revision target"
    ],
    [
      spec.assessmentAncestryRefs,
      "/spec/assessmentAncestryRefs",
      "GENERATION_ASSESSMENT_DUPLICATE",
      "Assessment ancestry"
    ]
  ]) {
    issues.push(...duplicateIssues(items, path, referenceIdentity, code, noun));
  }

  const requestResolution = resolveReference(
    spec.requestRef,
    "/spec/requestRef",
    resolver,
    "AuthoringRequest"
  );
  const assignmentResolution = resolveReference(
    spec.assignmentRef,
    "/spec/assignmentRef",
    resolver,
    "AuthoringAssignment"
  );
  const submissionResolution = resolveReference(
    spec.submissionRef,
    "/spec/submissionRef",
    resolver,
    "AuthoringSubmission"
  );
  const closureResolution = resolveReference(
    spec.contextClosureRef,
    "/spec/contextClosureRef",
    resolver,
    "ContextClosure"
  );
  const receiptResolution = resolveReference(
    spec.result?.commitReceiptRef,
    "/spec/result/commitReceiptRef",
    resolver,
    "AuthoringCommitReceipt"
  );
  issues.push(
    ...requestResolution.issues,
    ...assignmentResolution.issues,
    ...submissionResolution.issues,
    ...closureResolution.issues,
    ...receiptResolution.issues
  );
  if (requestResolution.resource) {
    issues.push(...refMismatch(
      "GENERATION_CONTEXT_CLOSURE_MISMATCH",
      "/spec/contextClosureRef",
      "GenerationRecord context must equal the AuthoringRequest context closure.",
      spec.contextClosureRef,
      requestResolution.resource.spec?.contextClosure?.reference
    ));
  }
  if (assignmentResolution.resource) {
    issues.push(...refMismatch(
      "GENERATION_ASSIGNMENT_REQUEST_MISMATCH",
      "/spec/assignmentRef",
      "GenerationRecord Assignment must bind its exact AuthoringRequest.",
      assignmentResolution.resource.spec?.request?.reference,
      spec.requestRef
    ));
  }
  if (submissionResolution.resource) {
    issues.push(...refMismatch(
      "GENERATION_SUBMISSION_ASSIGNMENT_MISMATCH",
      "/spec/submissionRef",
      "GenerationRecord Submission must bind its exact AuthoringAssignment.",
      submissionResolution.resource.spec?.assignment?.reference,
      spec.assignmentRef
    ));
  }
  if (receiptResolution.resource) {
    const cause = receiptResolution.resource.spec?.cause;
    if (cause?.class !== "task-submission") {
      issues.push(issue(
        "GENERATION_RUNTIME_CAUSE_FORBIDDEN",
        "/spec/result/commitReceiptRef",
        "GenerationRecord requires a cognitive task-submission receipt, not a runtime-only event."
      ));
    } else {
      issues.push(
        ...refMismatch(
          "GENERATION_RECEIPT_ASSIGNMENT_MISMATCH",
          "/spec/result/commitReceiptRef",
          "GenerationRecord receipt must bind its exact Assignment.",
          cause.assignment?.reference,
          spec.assignmentRef
        ),
        ...refMismatch(
          "GENERATION_RECEIPT_SUBMISSION_MISMATCH",
          "/spec/result/commitReceiptRef",
          "GenerationRecord receipt must bind its exact Submission.",
          cause.submission?.reference,
          spec.submissionRef
        )
      );
    }
    if (!referenceArrayEqual(
      receiptResolution.resource.spec?.createdResources,
      spec.result?.createdResourceRefs
    )) {
      issues.push(issue(
        "GENERATION_CREATED_RESULTS_MISMATCH",
        "/spec/result/createdResourceRefs",
        "GenerationRecord results must equal the receipt's ordered created-resource references."
      ));
    }
  }
  return issues;
}

const VALIDATORS = Object.freeze({
  Survey: validateSurvey,
  SurveyRound: validateSurveyRound,
  QuestionFrameSet: validateQuestionFrameSet,
  SurveyQuestionBinding: validateSurveyQuestionBinding,
  RoundInstrument: validateRoundInstrument,
  RoundInterpretation: validateRoundInterpretation,
  SurveyPolicySnapshot: validateSurveyPolicySnapshot,
  SurveyRuntimeArtifact: validateSurveyRuntimeArtifact,
  GenerationRecord: validateGenerationRecord
});

export function validateSurveyResourceSemantics(
  resource,
  { resolveReference: resolver } = {}
) {
  if (
    !resource ||
    typeof resource !== "object" ||
    Array.isArray(resource) ||
    resource.apiVersion !== SURVEY_API_VERSION ||
    !SURVEY_KINDS.has(resource.kind)
  ) {
    return Object.freeze([
      issue(
        "UNSUPPORTED_SURVEY_RESOURCE",
        "",
        "Value is not a supported Survey authoring resource."
      )
    ]);
  }
  return Object.freeze(VALIDATORS[resource.kind](resource, resolver));
}

export function createSurveyResourceResolver(resources) {
  const byIdentity = new Map();
  for (const resource of array(resources)) {
    const identity = referenceIdentity({
      apiVersion: resource?.apiVersion,
      kind: resource?.kind,
      name: resource?.metadata?.name,
      semanticDigest: resourceSemanticDigest(resource)
    });
    if (byIdentity.has(identity)) {
      throw new TypeError(
        `duplicate exact resource version ${JSON.stringify(identity)}`
      );
    }
    byIdentity.set(identity, resource);
  }
  return (reference) => byIdentity.get(referenceIdentity(reference));
}

export function validateSurveyResourceGraph(resources) {
  let resolver;
  try {
    resolver = createSurveyResourceResolver(resources);
  } catch (error) {
    return Object.freeze([
      issue("RESOURCE_VERSION_DUPLICATE", "", error.message)
    ]);
  }
  const issues = [];
  array(resources).forEach((resource, index) => {
    if (
      resource?.apiVersion !== SURVEY_API_VERSION ||
      !SURVEY_KINDS.has(resource?.kind)
    ) {
      return;
    }
    for (const candidate of validateSurveyResourceSemantics(resource, {
      resolveReference: resolver
    })) {
      issues.push(issue(
        candidate.code,
        `/resources/${index}${candidate.field}`,
        candidate.reason
      ));
    }
  });
  return Object.freeze(issues);
}

export { resourceSemanticDigest as surveyResourceSemanticDigest };
