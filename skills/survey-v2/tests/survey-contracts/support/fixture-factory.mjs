const DIGESTS = Object.freeze(
  Object.fromEntries(
    [..."0123456789abcdef"].map((character) => [
      character,
      `sha256:${character.repeat(64)}`
    ])
  )
);

function ref(apiVersion, kind, name, digestKey = "a") {
  return {
    apiVersion,
    kind,
    name,
    semanticDigest: DIGESTS[digestKey]
  };
}

function surveyRef(kind, name, digestKey) {
  return ref("survey.mission-kit/v1alpha1", kind, name, digestKey);
}

function sharedRef(kind, name, digestKey) {
  return ref("schemas.mission-kit/v1alpha1", kind, name, digestKey);
}

function authoringRef(kind, name, digestKey) {
  return ref("authoring.mission-kit/v1alpha1", kind, name, digestKey);
}

function resource(kind, name, spec, evidence) {
  const value = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind,
    metadata: { name },
    spec
  };
  if (evidence !== undefined) value.evidence = evidence;
  return value;
}

const surveyFrameRef = sharedRef("ContextFrame", "survey-frame", "1");
const round1FrameRef = sharedRef("ContextFrame", "round-1-frame", "2");
const round2FrameRef = sharedRef("ContextFrame", "round-2-frame", "3");
const surveyResourceRef = surveyRef("Survey", "survey-example", "4");
const round1Ref = surveyRef("SurveyRound", "round-1", "5");
const round2Ref = surveyRef("SurveyRound", "round-2", "6");
const round1InterpretationRef = surveyRef(
  "RoundInterpretation",
  "round-1-interpretation",
  "7"
);
const policyRef = surveyRef("SurveyPolicySnapshot", "survey-policy", "8");
const contextClosureRef = authoringRef("ContextClosure", "survey-context", "9");
const evidenceRef = authoringRef("SourceSnapshot", "survey-intent", "a");

function questionRef(ordinal) {
  return sharedRef("Question", `question-${ordinal}`, "b");
}

function questionFrameRef(ordinal) {
  return sharedRef("ContextFrame", `question-${ordinal}-frame`, "c");
}

function bindingRef(ordinal) {
  return surveyRef("SurveyQuestionBinding", `binding-${ordinal}`, "d");
}

function frameSetRef(roundOrdinal) {
  return surveyRef(
    "QuestionFrameSet",
    `round-${roundOrdinal}-frame-set`,
    "e"
  );
}

function instrumentRef(roundOrdinal) {
  return surveyRef(
    "RoundInstrument",
    `round-${roundOrdinal}-instrument`,
    "f"
  );
}

function roundFor(ordinal) {
  const roundOrdinal = ordinal <= 3 ? 1 : 2;
  const slot = ordinal - ((roundOrdinal - 1) * 3);
  return {
    roundOrdinal,
    slot,
    roundRef: roundOrdinal === 1 ? round1Ref : round2Ref,
    parentFrameRef: roundOrdinal === 1 ? round1FrameRef : round2FrameRef
  };
}

function frameSlots(roundOrdinal) {
  return [1, 2, 3].map((slot) => {
    const ordinal = slot + ((roundOrdinal - 1) * 3);
    const value = {
      slot,
      questionOrdinal: ordinal,
      contextFrameRef: questionFrameRef(ordinal),
      parentFrameRef: roundOrdinal === 1 ? round1FrameRef : round2FrameRef,
      scopeRelation: ["narrows", "partitions", "qualifies"][slot - 1],
      containmentRationale: `Question ${ordinal} is contained by its Round frame.`,
      intentDimension: ["outcome", "boundary", "trade-off"][slot - 1],
      outcomeAxisAnchors: [
        { axis: `axis-${ordinal}`, anchor: `anchor-${ordinal}` }
      ],
      sourceEvidenceRefs: [evidenceRef]
    };
    if (roundOrdinal === 2) {
      value.round1Relation = {
        interpretationRef: round1InterpretationRef,
        relation: ["refines", "challenges", "deepens"][slot - 1],
        rationale: `Question ${ordinal} relates to sealed Round-1 meaning.`
      };
    }
    return value;
  });
}

function questionBinding(ordinal) {
  const geometry = roundFor(ordinal);
  return resource("SurveyQuestionBinding", `binding-${ordinal}`, {
    frameSetRef: frameSetRef(geometry.roundOrdinal),
    roundRef: geometry.roundRef,
    slot: geometry.slot,
    questionOrdinal: ordinal,
    questionFrameRef: questionFrameRef(ordinal),
    questionRef: questionRef(ordinal),
    optionRelationship: "composable",
    incompatibilities: [],
    designRationale:
      `Question ${ordinal} provides distinct discriminating value within its frozen frame.`
  });
}

function roundInstrument(roundOrdinal) {
  const offset = (roundOrdinal - 1) * 3;
  return resource("RoundInstrument", `round-${roundOrdinal}-instrument`, {
    roundRef: roundOrdinal === 1 ? round1Ref : round2Ref,
    roundOrdinal,
    frameSetRef: frameSetRef(roundOrdinal),
    policySnapshotRef: policyRef,
    generationContextRef: contextClosureRef,
    units: [1, 2, 3].map((slot) => {
      const ordinal = offset + slot;
      return {
        slot,
        questionOrdinal: ordinal,
        questionFrameRef: questionFrameRef(ordinal),
        bindingRef: bindingRef(ordinal),
        questionRef: questionRef(ordinal)
      };
    }),
    responsePolicy: {
      capture: "option-id-list",
      rawEvidence: "preserved",
      duplicateSubmission: "idempotent",
      invalidSyntax: "reject-without-advance",
      unknownOption: "reject-without-advance",
      cardinalityViolation: "reject-without-advance",
      declaredConstraintViolation: "preserve-as-contradiction"
    }
  });
}

function runtimeSource(artifactType) {
  const edge = {
    RoundResponseSet: ["T10", "RESPOND_Q3"],
    RevisionDirective: ["T32", "DIRECTOR_RETURN"],
    CandidateValidationEvidence: ["T27", "CANDIDATE_VALIDATION_FAIL"],
    FinalizationDiagnostic: ["T38", "FINALIZATION_INVALIDATES_CANDIDATE"],
    CompositeRuntimeEvidence: ["T24", "BEGIN_COMPOSITE"]
  }[artifactType];
  return {
    surveyRunId: "survey-run-1",
    sourcePhaseTransitionId: edge[0],
    sourceEventId: edge[1],
    sourceSemanticRevision: 7,
    sourceDigest: DIGESTS.a
  };
}

function runtimeArtifact(name, artifactType, payload) {
  return resource("SurveyRuntimeArtifact", name, {
    artifactType,
    source: runtimeSource(artifactType),
    payload
  });
}

function roundResponseSet(roundOrdinal) {
  const offset = (roundOrdinal - 1) * 3;
  return runtimeArtifact(
    `round-${roundOrdinal}-responses`,
    "RoundResponseSet",
    {
      roundRef: roundOrdinal === 1 ? round1Ref : round2Ref,
      roundOrdinal,
      instrumentRef: instrumentRef(roundOrdinal),
      responses: [1, 2, 3].map((slot) => {
        const ordinal = offset + slot;
        return {
          slot,
          questionOrdinal: ordinal,
          questionRef: questionRef(ordinal),
          bindingRef: bindingRef(ordinal),
          rawEvidence: {
            mediaType: "text/plain;charset=utf-8",
            encoding: "base64",
            byteLength: 1,
            data: "YQ=="
          },
          normalizedPicks: ["a"],
          acknowledgedViewDigest: DIGESTS.b
        };
      })
    }
  );
}

function roundInterpretation(roundOrdinal) {
  const offset = (roundOrdinal - 1) * 3;
  const spec = {
    roundRef: roundOrdinal === 1 ? round1Ref : round2Ref,
    roundOrdinal,
    instrumentRef: instrumentRef(roundOrdinal),
    responseSetRef: surveyRef(
      "SurveyRuntimeArtifact",
      `round-${roundOrdinal}-responses`,
      "0"
    ),
    generationContextRef: contextClosureRef,
    perQuestion: [1, 2, 3].map((slot) => {
      const ordinal = offset + slot;
      return {
        questionOrdinal: ordinal,
        questionRef: questionRef(ordinal),
        meaning: `Interpreted meaning for question ${ordinal}.`,
        evidenceRefs: [evidenceRef],
        axisMappings: [
          {
            axis: `axis-${ordinal}`,
            meaning: `Meaning on axis ${ordinal}.`,
            evidenceQuestionOrdinals: [ordinal]
          }
        ],
        tensions: []
      };
    }),
    aggregateMeaning: `Aggregate meaning for Round ${roundOrdinal}.`,
    tensions: [],
    axisMapping: [
      {
        axis: `round-${roundOrdinal}-axis`,
        meaning: `Aggregate Round ${roundOrdinal} axis meaning.`,
        evidenceQuestionOrdinals: [offset + 1, offset + 2, offset + 3]
      }
    ]
  };
  if (roundOrdinal === 2) {
    spec.priorRoundInterpretationRef = round1InterpretationRef;
  }
  return resource(
    "RoundInterpretation",
    `round-${roundOrdinal}-interpretation`,
    spec
  );
}

export const positiveResources = Object.freeze({
  survey: resource("Survey", "survey-example", {
    policySnapshotRef: policyRef,
    surveyFrameRef,
    outcomeAxes: [
      "intent fidelity",
      "decision usefulness"
    ]
  }),
  "survey-round-1": resource("SurveyRound", "round-1", {
    surveyRef: surveyResourceRef,
    ordinal: 1,
    role: "foundation",
    surveyFrameRef,
    roundFrameRef: round1FrameRef,
    parentBinding: {
      parentFrameRef: surveyFrameRef,
      scopeRelation: "partitions",
      containmentRationale:
        "Round 1 partitions the Survey intent into foundation dimensions."
    }
  }),
  "survey-round-2": resource("SurveyRound", "round-2", {
    surveyRef: surveyResourceRef,
    ordinal: 2,
    role: "refinement",
    surveyFrameRef,
    roundFrameRef: round2FrameRef,
    parentBinding: {
      parentFrameRef: surveyFrameRef,
      scopeRelation: "qualifies",
      containmentRationale:
        "Round 2 qualifies the Survey intent using sealed Round-1 meaning."
    },
    round1InterpretationRef
  }),
  "question-frame-set-1": resource(
    "QuestionFrameSet",
    "round-1-frame-set",
    {
      roundRef: round1Ref,
      roundOrdinal: 1,
      parentFrameRef: round1FrameRef,
      slots: frameSlots(1),
      coverageRationale: "The three slots jointly cover outcome, boundary, and trade-off.",
      orthogonalityRationale: "Each slot isolates a distinct intent dimension."
    }
  ),
  "question-frame-set-2": resource(
    "QuestionFrameSet",
    "round-2-frame-set",
    {
      roundRef: round2Ref,
      roundOrdinal: 2,
      parentFrameRef: round2FrameRef,
      slots: frameSlots(2),
      coverageRationale: "The three slots refine all sealed Round-1 dimensions.",
      orthogonalityRationale: "Each refinement addresses a distinct unresolved dimension."
    }
  ),
  "survey-question-binding-1": questionBinding(1),
  "round-instrument-1": roundInstrument(1),
  "round-instrument-2": roundInstrument(2),
  "round-interpretation-1": roundInterpretation(1),
  "round-interpretation-2": roundInterpretation(2),
  "survey-policy-snapshot": resource(
    "SurveyPolicySnapshot",
    "survey-policy",
    {
      profileRef: authoringRef(
        "AuthoringProfileManifest",
        "survey-profile",
        "1"
      ),
      geometry: {
        rounds: 2,
        questionsPerRound: 3,
        totalQuestions: 6,
        choiceOptions: { minimum: 3, maximum: 4 }
      },
      disclosure: {
        mode: "single-current-question",
        siblingQuestionFramesVisible: false,
        futureQuestionsVisible: false,
        interimInterpretationVisible: false
      },
      generation: {
        questionFrameSetSize: 3,
        questionSetSize: 3,
        questionResourceType: {
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "Question"
        },
        contextFrameResourceType: {
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "ContextFrame"
        },
        roundTwoRelations: [
          "refines",
          "challenges",
          "disambiguates",
          "deepens"
        ]
      },
      validation: {
        rationaleRequired: true,
        authority: "mechanical-only",
        schemaBindings: [{ id: "survey-schemas", digest: DIGESTS.c }],
        validatorBindings: [{ id: "survey-validators", digest: DIGESTS.d }]
      },
      contextSelection: {
        preserveLayerRoles: true,
        allowInlineRuntimeState: false,
        selectors: [{ id: "survey-context", digest: DIGESTS.e }]
      }
    }
  ),
  "runtime-round-response-set": roundResponseSet(1),
  "runtime-revision-directive": runtimeArtifact(
    "revision-directive",
    "RevisionDirective",
    {
      target: "composite",
      targetRef: surveyRef("RoundInterpretation", "composite-candidate", "1"),
      directiveText: "Revise the composite while preserving ratified meaning.",
      directorEvidenceDigest: DIGESTS.f
    }
  ),
  "runtime-candidate-validation-evidence": runtimeArtifact(
    "candidate-validation",
    "CandidateValidationEvidence",
    {
      candidateRef: surveyRef(
        "RoundInterpretation",
        "composite-candidate",
        "1"
      ),
      validatorBindings: [{ id: "candidate-validator", digest: DIGESTS.a }],
      issues: [
        {
          code: "CANDIDATE_INCOMPLETE",
          path: "/spec",
          reason: "The candidate is incomplete.",
          nextAction: "revise-candidate"
        }
      ]
    }
  ),
  "runtime-finalization-diagnostic": runtimeArtifact(
    "finalization-diagnostic",
    "FinalizationDiagnostic",
    {
      target: "composite",
      candidateRef: surveyRef(
        "RoundInterpretation",
        "composite-candidate",
        "1"
      ),
      attemptDigest: DIGESTS.b,
      issues: [
        {
          code: "FINALIZATION_INVALID",
          path: "/spec",
          reason: "Finalization invalidated the candidate.",
          nextAction: "return-to-director"
        }
      ]
    }
  ),
  "runtime-composite-runtime-evidence": runtimeArtifact(
    "composite-runtime-evidence",
    "CompositeRuntimeEvidence",
    {
      methodologyRefs: [evidenceRef],
      authorityRefs: [surveyFrameRef],
      dependencyRefs: [round1InterpretationRef],
      runtimeRefs: [
        surveyRef("SurveyRuntimeArtifact", "round-1-responses", "0")
      ]
    }
  ),
  "generation-record": resource(
    "GenerationRecord",
    "round-1-frame-generation",
    {
      requestRef: authoringRef("AuthoringRequest", "frame-request", "1"),
      assignmentRef: authoringRef(
        "AuthoringAssignment",
        "frame-assignment",
        "2"
      ),
      submissionRef: authoringRef(
        "AuthoringSubmission",
        "frame-submission",
        "3"
      ),
      contextClosureRef,
      result: {
        commitReceiptRef: authoringRef(
          "AuthoringCommitReceipt",
          "frame-receipt",
          "4"
        ),
        createdResourceRefs: [frameSetRef(1)]
      },
      ancestry: {
        inputResourceRefs: [round1Ref, round1FrameRef],
        priorGenerationRecordRefs: [],
        revisionOfRefs: []
      },
      assessmentAncestryRefs: [evidenceRef]
    },
    {
      producer: {
        attemptId: "attempt-1",
        provider: "example-provider",
        model: "example-model",
        adapter: { id: "example-adapter", digest: DIGESTS["5"] },
        configurationDigest: DIGESTS["6"],
        telemetry: {
          latencyMs: 10,
          inputTokens: 20,
          outputTokens: 30,
          costMicrounits: 40
        }
      }
    }
  )
});

export const negativeFaults = Object.freeze({
  "question-frame-set-fourth-altitude": {
    base: "question-frame-set-1",
    operation: "add",
    path: "/spec/questionFrameRef",
    value: questionFrameRef(1),
    expectedIssue: "STRUCTURAL_REJECTION"
  },
  "question-frame-parent-mismatch": {
    base: "question-frame-set-1",
    operation: "replace",
    path: "/spec/slots/1/parentFrameRef",
    value: surveyFrameRef,
    expectedIssue: "QUESTION_FRAME_PARENT_MISMATCH"
  },
  "question-frame-slot-duplicate": {
    base: "question-frame-set-1",
    operation: "replace",
    path: "/spec/slots/1/slot",
    value: 1,
    expectedIssue: "FRAME_SLOT_DUPLICATE"
  },
  "round-instrument-incomplete": {
    base: "round-instrument-1",
    operation: "remove",
    path: "/spec/units/2",
    expectedIssue: "STRUCTURAL_REJECTION"
  },
  "binding-inline-survey-fields": {
    base: "survey-question-binding-1",
    operation: "add",
    path: "/spec/surveyContext",
    value: { roundOrdinal: 1 },
    expectedIssue: "STRUCTURAL_REJECTION"
  },
  "round-one-prior-interpretation": {
    base: "survey-round-1",
    operation: "add",
    path: "/spec/round1InterpretationRef",
    value: round1InterpretationRef,
    expectedIssue: "ROUND_ONE_PRIOR_INTERPRETATION"
  },
  "round-two-missing-interpretation": {
    base: "survey-round-2",
    operation: "remove",
    path: "/spec/round1InterpretationRef",
    expectedIssue: "ROUND_TWO_INTERPRETATION_REQUIRED"
  },
  "round-instrument-inline-question": {
    base: "round-instrument-1",
    operation: "add",
    path: "/spec/questions",
    value: [{ prompt: "Inline content is forbidden." }],
    expectedIssue: "STRUCTURAL_REJECTION"
  },
  "runtime-source-mismatch": {
    base: "runtime-revision-directive",
    operation: "replace",
    path: "/spec/source/sourceEventId",
    value: "BEGIN_COMPOSITE",
    expectedIssue: "RUNTIME_SOURCE_EDGE_MISMATCH"
  }
});

export { DIGESTS, authoringRef, ref, sharedRef, surveyRef };
