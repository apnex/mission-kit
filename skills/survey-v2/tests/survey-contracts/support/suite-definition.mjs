export const surveyContractSuite = Object.freeze([
  {
    obligationId: "O-SV01-01",
    invariantId: "SV01",
    statement:
      "the Survey resource fixes the two-round three-question geometry and top frame",
    category: "resources",
    name: "survey-geometry",
    evidenceClass: "conformance",
    schema: "survey.schema.json",
    fixtures: ["survey", "survey-policy-snapshot"]
  },
  {
    obligationId: "O-SV01-02",
    invariantId: "SV01",
    statement: "SurveyRound encodes its round altitude and exact ancestry",
    category: "resources",
    name: "survey-round-ancestry",
    evidenceClass: "conformance",
    schema: "survey-round.schema.json",
    fixtures: ["survey-round-1", "survey-round-2"]
  },
  {
    obligationId: "O-SV01-03",
    invariantId: "SV01",
    statement:
      "same-ordinal resources cannot cross exact Round or Survey lineage",
    category: "resources",
    name: "exact-round-scoped-joins",
    evidenceClass: "negative",
    schema: "survey-round.schema.json",
    fixtures: [
      "survey-round-1",
      "survey-round-2",
      "round-instrument-1",
      "runtime-round-response-set",
      "round-interpretation-1",
      "authoring/context-closure"
    ]
  },
  {
    obligationId: "O-SV02-01",
    invariantId: "SV02",
    statement:
      "QuestionFrameSet is a coordination container and not a ContextFrame altitude",
    category: "resources",
    name: "frame-set-coordination-container",
    evidenceClass: "conformance",
    schema: "question-frame-set.schema.json",
    fixtures: [
      "question-frame-set-1",
      "negative/question-frame-set-fourth-altitude"
    ]
  },
  {
    obligationId: "O-SV03-01",
    invariantId: "SV03",
    statement:
      "child frame bindings carry the exact parent reference, scope relation, and rationale",
    category: "resources",
    name: "child-frame-bindings",
    evidenceClass: "positive",
    schema: "question-frame-set.schema.json",
    fixtures: ["question-frame-set-1"]
  },
  {
    obligationId: "O-SV03-02",
    invariantId: "SV03",
    statement: "mismatched parent ancestry is rejected semantically",
    category: "semantics",
    name: "parent-ancestry-mismatch",
    evidenceClass: "negative",
    schema: "question-frame-set.schema.json",
    fixtures: [
      "question-frame-set-1",
      "negative/question-frame-parent-mismatch"
    ]
  },
  {
    obligationId: "O-SV04-01",
    invariantId: "SV04",
    statement: "exactly three ordered QuestionFrame slots are accepted",
    category: "resources",
    name: "ordered-question-frame-slots",
    evidenceClass: "positive",
    schema: "question-frame-set.schema.json",
    fixtures: ["question-frame-set-1"]
  },
  {
    obligationId: "O-SV04-02",
    invariantId: "SV04",
    statement:
      "non-three or duplicate QuestionFrame slot geometry is rejected",
    category: "resources",
    name: "invalid-question-frame-slots",
    evidenceClass: "negative",
    schema: "question-frame-set.schema.json",
    fixtures: [
      "question-frame-set-1",
      "negative/question-frame-slot-duplicate"
    ]
  },
  {
    obligationId: "O-SV05-01",
    invariantId: "SV05",
    statement:
      "a binding associates one neutral Question with one frozen frame slot",
    category: "resources",
    name: "neutral-question-binding",
    evidenceClass: "positive",
    schema: "survey-question-binding.schema.json",
    fixtures: ["survey-question-binding-1"]
  },
  {
    obligationId: "O-SV05-02",
    invariantId: "SV05",
    statement:
      "RoundInstrument closes exactly three ordered Question, binding, and frame references",
    category: "resources",
    name: "round-instrument-closure",
    evidenceClass: "positive",
    schema: "round-instrument.schema.json",
    fixtures: ["round-instrument-1"]
  },
  {
    obligationId: "O-SV05-03",
    invariantId: "SV05",
    statement: "an incomplete or inconsistent RoundInstrument is rejected",
    category: "resources",
    name: "incomplete-round-instrument",
    evidenceClass: "negative",
    schema: "round-instrument.schema.json",
    fixtures: [
      "round-instrument-1",
      "negative/round-instrument-incomplete"
    ]
  },
  {
    obligationId: "O-SV06-01",
    invariantId: "SV06",
    statement:
      "SurveyQuestionBinding admits only a shared neutral Question reference and never inline Survey fields",
    category: "resources",
    name: "binding-neutrality",
    evidenceClass: "conformance",
    schema: "survey-question-binding.schema.json",
    fixtures: [
      "survey-question-binding-1",
      "negative/binding-inline-survey-fields"
    ]
  },
  {
    obligationId: "O-SV07-01",
    invariantId: "SV07",
    statement: "Round-1 ancestry forbids a prior-round interpretation",
    category: "semantics",
    name: "round-one-prior-forbidden",
    evidenceClass: "negative",
    schema: "survey-round.schema.json",
    fixtures: [
      "survey-round-1",
      "negative/round-one-prior-interpretation"
    ]
  },
  {
    obligationId: "O-SV07-02",
    invariantId: "SV07",
    statement:
      "Round-2 ancestry requires the exact sealed Round-1 interpretation",
    category: "semantics",
    name: "round-two-prior-required",
    evidenceClass: "negative",
    schema: "survey-round.schema.json",
    fixtures: [
      "survey-round-2",
      "negative/round-two-missing-interpretation"
    ]
  },
  {
    obligationId: "O-SV07-03",
    invariantId: "SV07",
    statement:
      "RoundInterpretation preserves exact round-specific ancestry and ordinals",
    category: "semantics",
    name: "round-interpretation-ancestry",
    evidenceClass: "positive",
    schema: "round-interpretation.schema.json",
    fixtures: ["round-interpretation-1", "round-interpretation-2"]
  },
  {
    obligationId: "O-SV09-01",
    invariantId: "SV09",
    statement:
      "semantic validators check structural ancestry and rationale presence without judging rationale truth",
    category: "semantics",
    name: "rationale-authority-boundary",
    evidenceClass: "conformance",
    schema: "question-frame-set.schema.json",
    fixtures: ["question-frame-set-1"]
  },
  {
    obligationId: "O-SV10-01",
    invariantId: "SV10",
    statement: "RoundInstrument is an immutable-reference-only runtime input",
    category: "resources",
    name: "immutable-round-instrument",
    evidenceClass: "positive",
    schema: "round-instrument.schema.json",
    fixtures: [
      "round-instrument-1",
      "negative/round-instrument-inline-question"
    ]
  },
  {
    obligationId: "O-SV10-02",
    invariantId: "SV10",
    statement:
      "SurveyPolicySnapshot freezes the exact geometry, disclosure, and context-selection policy",
    category: "resources",
    name: "survey-policy-snapshot",
    evidenceClass: "positive",
    schema: "survey-policy-snapshot.schema.json",
    fixtures: ["survey-policy-snapshot"]
  },
  {
    obligationId: "O-SV13-01",
    invariantId: "SV13",
    statement: "SurveyRuntimeArtifact admits exactly five closed variants",
    category: "runtime-artifacts",
    name: "closed-runtime-variants",
    evidenceClass: "conformance",
    schema: "survey-runtime-artifact.schema.json",
    fixtures: [
      "runtime-round-response-set",
      "runtime-revision-directive",
      "runtime-candidate-validation-evidence",
      "runtime-finalization-diagnostic",
      "runtime-composite-runtime-evidence"
    ]
  },
  {
    obligationId: "O-SV13-02",
    invariantId: "SV13",
    statement:
      "every SurveyRuntimeArtifact variant binds its run, event, phase, revision, and source digest",
    category: "runtime-artifacts",
    name: "runtime-source-bindings",
    evidenceClass: "conformance",
    schema: "survey-runtime-artifact.schema.json",
    fixtures: [
      "runtime-round-response-set",
      "runtime-revision-directive",
      "runtime-candidate-validation-evidence",
      "runtime-finalization-diagnostic",
      "runtime-composite-runtime-evidence",
      "negative/runtime-source-mismatch"
    ]
  },
  {
    obligationId: "O-SV13-03",
    invariantId: "SV13",
    statement:
      "RoundInterpretation runtime ingress resolves only a typed RoundResponseSet artifact",
    category: "runtime-artifacts",
    name: "typed-round-response-ingress",
    evidenceClass: "negative",
    schema: "round-interpretation.schema.json",
    fixtures: [
      "round-interpretation-1",
      "runtime-revision-directive"
    ]
  },
  {
    obligationId: "O-AS10-07",
    invariantId: "AS10",
    statement:
      "GenerationRecord producer and evidence changes do not alter its created-resource references",
    category: "resources",
    name: "generation-producer-nonidentity",
    evidenceClass: "comparison",
    schema: "generation-record.schema.json",
    fixtures: ["generation-record"]
  },
  {
    obligationId: "O-AS14-21",
    invariantId: "AS14",
    statement:
      "GenerationRecord binds the exact Request, Assignment, Submission, created results, and ancestry",
    category: "resources",
    name: "generation-exact-ancestry",
    evidenceClass: "conformance",
    schema: "generation-record.schema.json",
    fixtures: [
      "generation-record",
      "survey",
      "authoring/authoring-request",
      "authoring/authoring-assignment",
      "authoring/authoring-submission",
      "authoring/context-closure",
      "authoring/authoring-commit-receipt",
      "authoring/authoring-mutation"
    ]
  }
]);
