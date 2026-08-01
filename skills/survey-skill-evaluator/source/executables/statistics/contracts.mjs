import { stabilizeJson } from "./input-boundary.mjs";

const DRAFT = "https://json-schema.org/draft/2020-12/schema";
const PREFIX = "urn:mission-kit:survey-skill-evaluator:";
const HASH_PROFILE_ID = "survey-evaluator-sha256-jcs-v1";
const ID_PATTERN = "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$";
const DIGEST_PATTERN = "^[a-f0-9]{64}$";

const id = () => ({ type: "string", pattern: ID_PATTERN });
const digest = () => ({ type: "string", pattern: DIGEST_PATTERN });
const idArray = () => ({ type: "array", items: id(), uniqueItems: true });
const digestArray = () => ({
  type: "array",
  items: digest(),
  uniqueItems: true,
});
const jsonPathArray = () => ({
  type: "array",
  items: {
    type: "string",
    pattern: "^\\$(?:\\.[A-Za-z0-9_-]+|\\[[0-9]+\\])*$",
  },
  uniqueItems: true,
});
const finiteNumber = () => ({ type: "number" });
const nonNegativeInteger = () => ({ type: "integer", minimum: 0 });
const nonNegativeNumber = () => ({ type: "number", minimum: 0 });
const probability = () => ({ type: "number", minimum: 0, maximum: 1 });

function closed(properties, required = Object.keys(properties), extra = {}) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required,
    ...extra,
  };
}

function root(name, properties, required, defs = undefined) {
  const value = {
    $schema: DRAFT,
    $id: `${PREFIX}${name}`,
    ...closed(
      {
        schemaVersion: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        hashProfileId: { const: HASH_PROFILE_ID },
        ...properties,
      },
      ["schemaVersion", "hashProfileId", ...required],
    ),
  };
  if (defs) value.$defs = defs;
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const metricDirection = {
  enum: [
    "higher-is-better",
    "lower-is-better",
    "descriptive",
    "protected-descriptive",
  ],
};

const factor = closed({
  factorId: id(),
  field: id(),
  sampling: { enum: ["fixed", "sampled"] },
  relation: { enum: ["root", "nested", "crossed"] },
  parentFactorId: { anyOf: [id(), { type: "null" }] },
  generalizationPopulation: { anyOf: [id(), { type: "null" }] },
  assignmentMechanism: { anyOf: [id(), { type: "null" }] },
  clusterCountFloor: nonNegativeInteger(),
});

const metricResult = closed({
  metricResultId: id(),
  metricId: id(),
  armId: id(),
  nativeUnit: id(),
  status: {
    enum: [
      "observed",
      "not_observed",
      "not_judgeable",
      "structural_missing",
      "unresolved_bounded",
    ],
  },
  value: { anyOf: [finiteNumber(), { type: "null" }] },
  lower: { anyOf: [finiteNumber(), { type: "null" }] },
  upper: { anyOf: [finiteNumber(), { type: "null" }] },
  evidenceRefs: digestArray(),
}, undefined, {
  allOf: [
    {
      if: {
        properties: { status: { const: "observed" } },
        required: ["status"],
      },
      then: {
        properties: {
          value: finiteNumber(),
          lower: finiteNumber(),
          upper: finiteNumber(),
        },
      },
    },
    {
      if: {
        properties: {
          status: {
            enum: [
              "not_observed",
              "not_judgeable",
              "structural_missing",
            ],
          },
        },
        required: ["status"],
      },
      then: {
        properties: {
          value: { type: "null" },
          lower: { type: "null" },
          upper: { type: "null" },
        },
      },
    },
    {
      if: {
        properties: {
          status: { const: "unresolved_bounded" },
        },
        required: ["status"],
      },
      then: {
        properties: {
          value: { type: "null" },
          lower: finiteNumber(),
          upper: finiteNumber(),
        },
      },
    },
  ],
});

const populationView = closed({
  populationClass: {
    enum: ["all_assigned", "instrument_valid", "release_eligible"],
  },
  assignmentCount: nonNegativeInteger(),
  observedCount: nonNegativeInteger(),
  missingCount: nonNegativeInteger(),
  failureCount: nonNegativeInteger(),
  contaminationCount: nonNegativeInteger(),
  denominatorDigest: digest(),
});

const interval = closed({
  lower: finiteNumber(),
  upper: finiteNumber(),
  confidence: probability(),
  simultaneous: { type: "boolean" },
  method: id(),
});

const dependencePlan = root(
  "dependence-plan",
  {
    dependencePlanId: id(),
    factors: { type: "array", items: factor, minItems: 1 },
    stratumFields: idArray(),
    blockFields: idArray(),
    assignmentBased: { type: "boolean" },
    resamplingMethod: {
      enum: [
        "fixed_design",
        "stratified_cluster_bootstrap",
        "multiway_cluster_bootstrap",
        "assignment_randomization",
      ],
    },
    targetPopulation: id(),
    effectiveIndependentClusterCounts: {
      type: "array",
      items: closed({
        factorId: id(),
        count: nonNegativeInteger(),
      }),
    },
    estimatorId: id(),
    resamplerId: id(),
    seedCommitmentDigest: digest(),
  },
  [
    "dependencePlanId",
    "factors",
    "stratumFields",
    "blockFields",
    "assignmentBased",
    "resamplingMethod",
    "targetPopulation",
    "effectiveIndependentClusterCounts",
    "estimatorId",
    "resamplerId",
    "seedCommitmentDigest",
  ],
);

const metricDescriptor = root(
  "metric-descriptor",
  {
    metricId: { type: "string", pattern: "^[A-Z][A-Z0-9_]+$" },
    dimension: id(),
    nativeRepresentation: { type: "string", minLength: 1 },
    nativeUnit: id(),
    direction: metricDirection,
    denominatorClass: {
      enum: [
        "survey_all_assigned",
        "survey_instrument_valid",
        "downstream_itt",
        "obligation_exposure",
        "review_position",
        "attention_source_cut",
      ],
    },
    missingMapping: id(),
    failureMapping: id(),
    aggregationRecipeId: id(),
    attentionEconomicClass: {
      enum: ["none", "toil", "learning_investment"],
    },
    primaryEligible: { type: "boolean" },
    evidenceRefs: digestArray(),
  },
  [
    "metricId",
    "dimension",
    "nativeRepresentation",
    "nativeUnit",
    "direction",
    "denominatorClass",
    "missingMapping",
    "failureMapping",
    "aggregationRecipeId",
    "attentionEconomicClass",
    "primaryEligible",
    "evidenceRefs",
  ],
  undefined,
);

const rubric = root(
  "rubric",
  {
    rubricId: id(),
    purpose: { enum: ["survey_semantic", "downstream_utility", "incident"] },
    semanticKeyDigest: digest(),
    dimensions: {
      type: "array",
      minItems: 1,
      items: closed({
        dimensionId: id(),
        obligationIds: idArray(),
        nativeScale: {
          enum: [
            "nominal",
            "ordinal",
            "interval",
            "count",
            "binary",
          ],
        },
        anchors: {
          type: "array",
          minItems: 2,
          items: closed({
            value: {
              anyOf: [
                finiteNumber(),
                { type: "string", minLength: 1, maxLength: 256 },
              ],
            },
            meaning: { type: "string", minLength: 1, maxLength: 2000 },
          }),
        },
        weight: nonNegativeNumber(),
        citationRequired: { const: true },
        missingRule: { enum: ["not_judgeable", "registered_adverse"] },
      }),
    },
    fixedExposureDenominators: {
      type: "array",
      items: closed({
        dimensionId: id(),
        denominator: { type: "integer", minimum: 1 },
      }),
    },
    evidenceRefs: digestArray(),
  },
  [
    "rubricId",
    "purpose",
    "semanticKeyDigest",
    "dimensions",
    "fixedExposureDenominators",
    "evidenceRefs",
  ],
);

const analysisPlan = root(
  "analysis-plan",
  {
    analysisPlanId: id(),
    preregistrationDigest: digest(),
    claimIds: idArray(),
    primaryMetricIds: idArray(),
    secondaryMetricIds: idArray(),
    diagnosticMetricIds: idArray(),
    targetPopulation: id(),
    stratumWeights: {
      type: "array",
      minItems: 1,
      items: closed({
        stratumId: id(),
        weight: probability(),
      }),
    },
    dependencePlanDigest: digest(),
    estimand: closed({
      estimandId: id(),
      treatmentArmId: id(),
      controlArmId: id(),
      analysisUnit: id(),
      contrastFunction: id(),
      supportedConclusion: { type: "string", minLength: 1, maxLength: 2000 },
    }),
    missingness: closed({
      lowerBound: finiteNumber(),
      upperBound: finiteNumber(),
      candidateFailureMapping: id(),
      exogenousMissingRule: id(),
      sensitivityRecipeIds: idArray(),
      completeCasePrimaryForbidden: { const: true },
    }),
    inference: closed({
      method: id(),
      confidence: probability(),
      resampleCount: { type: "integer", minimum: 100 },
      convergenceTolerance: { type: "number", exclusiveMinimum: 0 },
      seedCommitmentDigest: digest(),
    }),
    multiplicity: closed({
      familyId: id(),
      purpose: {
        enum: [
          "confirmatory_causal",
          "release_assurance",
          "candidate_selection",
          "equivalence",
          "exploratory_diagnostic",
        ],
      },
      procedure: { enum: ["holm", "max_t", "simultaneous_coverage", "fdr"] },
      alpha: probability(),
    }),
    agreement: closed({
      minimumValidBallots: { type: "integer", minimum: 2 },
      scaleMethod: id(),
      adjudicationPolicyDigest: digest(),
    }),
    ranking: closed({
      guardrailIds: idArray(),
      usePareto: { const: true },
      rankIntervalConfidence: probability(),
      tieRecipeId: id(),
      weightedPolicyId: { anyOf: [id(), { type: "null" }] },
    }),
    attentionProtection: closed({
      minimizeOnlyToil: { const: true },
      learningInvestmentAdverse: { const: false },
      directorStrategicJudgmentAdverse: { const: false },
      unresolvedExcluded: { const: true },
    }),
    recommendationPolicyDigest: digest(),
  },
  [
    "analysisPlanId",
    "preregistrationDigest",
    "claimIds",
    "primaryMetricIds",
    "secondaryMetricIds",
    "diagnosticMetricIds",
    "targetPopulation",
    "stratumWeights",
    "dependencePlanDigest",
    "estimand",
    "missingness",
    "inference",
    "multiplicity",
    "agreement",
    "ranking",
    "attentionProtection",
    "recommendationPolicyDigest",
  ],
);

const agreementReport = root(
  "agreement-report",
  {
    agreementReportId: id(),
    purpose: { enum: ["incident", "semantic", "downstream", "ranking"] },
    scale: { enum: ["nominal", "ordinal", "interval", "ranking", "span"] },
    method: id(),
    estimate: { anyOf: [finiteNumber(), { type: "null" }] },
    status: { enum: ["estimated", "not_estimable"] },
    interval: { anyOf: [interval, { type: "null" }] },
    unitCount: nonNegativeInteger(),
    ratingCount: nonNegativeInteger(),
    judgeCount: nonNegativeInteger(),
    dependencePlanDigest: digest(),
    preAdjudication: { const: true },
    evidenceRefs: digestArray(),
  },
  [
    "agreementReportId",
    "purpose",
    "scale",
    "method",
    "estimate",
    "status",
    "interval",
    "unitCount",
    "ratingCount",
    "judgeCount",
    "dependencePlanDigest",
    "preAdjudication",
    "evidenceRefs",
  ],
);

const reviewAggregation = root(
  "review-aggregation",
  {
    reviewAggregationId: id(),
    purpose: {
      enum: [
        "execution_incident",
        "semantic",
        "downstream",
        "review_incident",
      ],
    },
    expectedSlotIds: idArray(),
    validResultIds: idArray(),
    failedSlotIds: idArray(),
    unusedCapacityIds: idArray(),
    minimumValidCount: { type: "integer", minimum: 2 },
    minimumValidSatisfied: { type: "boolean" },
    agreementReportDigest: { anyOf: [digest(), { type: "null" }] },
    measurementStatus: { enum: ["judgeable", "not_judgeable", "unresolved"] },
    adjudicationTriggered: { type: "boolean" },
    triggerReasonIds: idArray(),
    disagreementIds: idArray(),
    rawBallotsPreserved: { const: true },
    armMapConsumed: { const: false },
  },
  [
    "reviewAggregationId",
    "purpose",
    "expectedSlotIds",
    "validResultIds",
    "failedSlotIds",
    "unusedCapacityIds",
    "minimumValidCount",
    "minimumValidSatisfied",
    "agreementReportDigest",
    "measurementStatus",
    "adjudicationTriggered",
    "triggerReasonIds",
    "disagreementIds",
    "rawBallotsPreserved",
    "armMapConsumed",
  ],
);

const qualificationOverlay = root(
  "qualification-overlay",
  {
    qualificationOverlayId: id(),
    purpose: { enum: ["execution_qualification", "final_measurement"] },
    frozenEvidenceDigest: digest(),
    attributionDigest: digest(),
    sourceResultIds: idArray(),
    mappings: {
      type: "array",
      items: closed({
        metricResultId: id(),
        metricId: id(),
        armId: id(),
        sourceClass: id(),
        effect: {
          enum: [
            "retain",
            "candidate_adverse",
            "structural_missing",
            "unresolved_bounds",
            "not_judgeable",
          ],
        },
        eligible: { type: "boolean" },
        lowerBound: { anyOf: [finiteNumber(), { type: "null" }] },
        upperBound: { anyOf: [finiteNumber(), { type: "null" }] },
        evidenceRefs: digestArray(),
      }, [
        "metricResultId",
        "metricId",
        "armId",
        "sourceClass",
        "effect",
        "eligible",
        "lowerBound",
        "upperBound",
        "evidenceRefs",
      ]),
    },
    sourceEvidenceMutated: { const: false },
  },
  [
    "qualificationOverlayId",
    "purpose",
    "frozenEvidenceDigest",
    "attributionDigest",
    "sourceResultIds",
    "mappings",
    "sourceEvidenceMutated",
  ],
);

const analysisResult = root(
  "analysis-result",
  {
    analysisResultId: id(),
    analysisPlanDigest: digest(),
    campaignEvidenceEnvelopeDigest: digest(),
    protectedUnmaskGrantDigest: digest(),
    dependencePlanDigest: digest(),
    softwareDigest: digest(),
    populationViews: {
      type: "array",
      minItems: 3,
      items: populationView,
    },
    metricResults: {
      type: "array",
      items: metricResult,
    },
    effects: {
      type: "array",
      items: closed({
        effectId: id(),
        metricId: id(),
        estimandId: id(),
        status: {
          enum: ["estimated", "not_estimable"],
        },
        estimate: {
          anyOf: [finiteNumber(), { type: "null" }],
        },
        interval,
        practicalClass: {
          enum: ["superior", "inferior", "equivalent", "uncertain"],
        },
        effectiveClusterCounts: {
          type: "array",
          items: closed({ factorId: id(), count: nonNegativeInteger() }),
        },
      }, undefined, {
        allOf: [
          {
            if: {
              properties: {
                status: { const: "estimated" },
              },
              required: ["status"],
            },
            then: {
              properties: {
                estimate: finiteNumber(),
              },
            },
          },
          {
            if: {
              properties: {
                status: { const: "not_estimable" },
              },
              required: ["status"],
            },
            then: {
              properties: {
                estimate: { type: "null" },
                practicalClass: { const: "uncertain" },
              },
            },
          },
        ],
      }),
    },
    multiplicityResult: closed({
      procedure: id(),
      strongFwerControlled: { type: "boolean" },
      adjustedFindingIds: idArray(),
    }),
    missingnessResults: {
      type: "array",
      items: closed({
        metricId: id(),
        denominatorDigest: digest(),
        treatmentAssignmentCount: nonNegativeInteger(),
        treatmentObservedCount: nonNegativeInteger(),
        treatmentMissingCount: nonNegativeInteger(),
        treatmentFailureCount: nonNegativeInteger(),
        controlAssignmentCount: nonNegativeInteger(),
        controlObservedCount: nonNegativeInteger(),
        controlMissingCount: nonNegativeInteger(),
        controlFailureCount: nonNegativeInteger(),
        treatmentMissingRate: probability(),
        controlMissingRate: probability(),
        lowerContrastBound: finiteNumber(),
        upperContrastBound: finiteNumber(),
      }),
    },
    ranking: closed({
      nonDominatedCandidateIds: idArray(),
      candidateRankResults: {
        type: "array",
        items: closed({
          candidateId: id(),
          medianRank: finiteNumber(),
          lowerRank: finiteNumber(),
          upperRank: finiteNumber(),
          proportionRankedBest: probability(),
        }),
      },
      totalOrderSupported: { type: "boolean" },
    }),
    attention: closed({
      toilResultIds: idArray(),
      protectedLearningResultIds: idArray(),
      directorJudgmentResultIds: idArray(),
      unresolvedObservationIds: idArray(),
      protectedLearningCanWorsenSelection: { const: false },
    }),
    sensitivityResultIds: idArray(),
    derivationRecordDigests: digestArray(),
    campaignLineageDisclosureDigest: { type: "null" },
  },
  [
    "analysisResultId",
    "analysisPlanDigest",
    "campaignEvidenceEnvelopeDigest",
    "protectedUnmaskGrantDigest",
    "dependencePlanDigest",
    "softwareDigest",
    "populationViews",
    "metricResults",
    "effects",
    "multiplicityResult",
    "missingnessResults",
    "ranking",
    "attention",
    "sensitivityResultIds",
    "derivationRecordDigests",
    "campaignLineageDisclosureDigest",
  ],
);

const recommendation = root(
  "recommendation",
  {
    recommendationId: id(),
    analysisResultDigest: digest(),
    recommendationPolicyDigest: digest(),
    class: {
      enum: [
        "recommend_accept",
        "recommend_accept_with_guardrails",
        "recommend_revise_and_repeat",
        "recommend_reject",
        "insufficient_or_invalid_evidence",
      ],
    },
    supportedClaimIds: idArray(),
    dimensionalResultIds: idArray(),
    guardrailIds: idArray(),
    limitationIds: idArray(),
    sensitivityResultIds: idArray(),
    attentionProof: closed({
      toilOnlyAdverse: { const: true },
      learningInvestmentAdverse: { const: false },
      directorJudgmentAdverse: { const: false },
      unresolvedAttentionExcluded: { const: true },
    }),
    policyClauses: {
      type: "array",
      items: closed({
        clauseId: id(),
        passed: { type: "boolean" },
        evidenceRefs: digestArray(),
      }),
    },
    promotionAuthorized: { const: false },
  },
  [
    "recommendationId",
    "analysisResultDigest",
    "recommendationPolicyDigest",
    "class",
    "supportedClaimIds",
    "dimensionalResultIds",
    "guardrailIds",
    "limitationIds",
    "sensitivityResultIds",
    "attentionProof",
    "policyClauses",
    "promotionAuthorized",
  ],
);

const calibrationCorpus = root(
  "calibration-corpus",
  {
    calibrationCorpusId: id(),
    version: id(),
    stewardAuthorityId: id(),
    consentPolicyDigest: digest(),
    deidentificationPolicyDigest: digest(),
    protectionClass: id(),
    calibrationCohortDigest: digest(),
    holdoutCohortDigest: digest(),
    holdoutPolicy: {
      oneOf: [
        closed({
          mode: { const: "single_use" },
          exposureDomainKey: digest(),
        }),
        closed({
          mode: { const: "reusable_holdout" },
          exposureDomainKey: digest(),
          reusableBudgetKey: digest(),
          budget: { type: "integer", minimum: 1 },
        }),
      ],
    },
    driftDimensions: idArray(),
    driftEvidenceRefs: digestArray(),
    retentionPolicyDigest: digest(),
  },
  [
    "calibrationCorpusId",
    "version",
    "stewardAuthorityId",
    "consentPolicyDigest",
    "deidentificationPolicyDigest",
    "protectionClass",
    "calibrationCohortDigest",
    "holdoutCohortDigest",
    "holdoutPolicy",
    "driftDimensions",
    "driftEvidenceRefs",
    "retentionPolicyDigest",
  ],
);

const controlDeltaAudit = root(
  "control-delta-audit",
  {
    controlDeltaAuditId: id(),
    treatmentSnapshotDigest: digest(),
    controlSnapshotDigest: digest(),
    manipulatedMechanismId: id(),
    allowedDifferencePaths: jsonPathArray(),
    observedDifferencePaths: jsonPathArray(),
    forbiddenDifferencePaths: jsonPathArray(),
    forbiddenDoctrineTerms: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 256 },
      uniqueItems: true,
    },
    doctrineLeakTerms: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 256 },
      uniqueItems: true,
    },
    commonContractDigest: digest(),
    manipulationChecks: {
      type: "array",
      minItems: 1,
      items: closed({
        checkId: id(),
        passed: { type: "boolean" },
        evidenceRefs: digestArray(),
      }),
    },
    expectedDirectionVisibleToAuditor: { const: false },
    passed: { type: "boolean" },
  },
  [
    "controlDeltaAuditId",
    "treatmentSnapshotDigest",
    "controlSnapshotDigest",
    "manipulatedMechanismId",
    "allowedDifferencePaths",
    "observedDifferencePaths",
    "forbiddenDifferencePaths",
    "forbiddenDoctrineTerms",
    "doctrineLeakTerms",
    "commonContractDigest",
    "manipulationChecks",
    "expectedDirectionVisibleToAuditor",
    "passed",
  ],
);

const reviewerSlot = closed({
  stableSlotKey: id(),
  purpose: id(),
  plannedObservationKey: id(),
  primaryOpaqueIdentityId: id(),
  orderedReplacementOpaqueIdentityIds: idArray(),
  presentationRank: nonNegativeInteger(),
  conditionalTriggerId: { anyOf: [id(), { type: "null" }] },
});

const reviewerAllocationPlan = root(
  "reviewer-allocation-plan",
  {
    reviewerAllocationPlanId: id(),
    confirmatoryFamilyId: id(),
    familyAllocationDigest: digest(),
    registrySnapshotDigest: digest(),
    stableSlotUniverseDigest: digest(),
    allocationPolicyDigest: digest(),
    slots: { type: "array", items: reviewerSlot, minItems: 1 },
    balanceProofDigest: digest(),
    overlapProofDigest: digest(),
    replacementBudgetPolicyDigest: digest(),
    outcomeInputsUsed: { const: false },
    armMapDisclosed: { const: false },
  },
  [
    "reviewerAllocationPlanId",
    "confirmatoryFamilyId",
    "familyAllocationDigest",
    "registrySnapshotDigest",
    "stableSlotUniverseDigest",
    "allocationPolicyDigest",
    "slots",
    "balanceProofDigest",
    "overlapProofDigest",
    "replacementBudgetPolicyDigest",
    "outcomeInputsUsed",
    "armMapDisclosed",
  ],
);

const familyAllocationRecord = root(
  "family-allocation-record",
  {
    familyAllocationRecordId: id(),
    confirmatoryFamilyId: id(),
    decisionLineageId: id(),
    allocationLineageId: id(),
    allocationOrdinal: nonNegativeInteger(),
    provenance: { enum: ["fresh", "copied_compatible", "inherited_schedule"] },
    registrySnapshotDigest: digest(),
    stableSlotUniverseDigest: digest(),
    allocationPolicyDigest: digest(),
    beaconEvidenceDigest: { anyOf: [digest(), { type: "null" }] },
    predecessorAllocationDigest: { anyOf: [digest(), { type: "null" }] },
    subjectArmMappingDigest: digest(),
    denominatorDigest: digest(),
    reviewerAllocationPlan,
    rerollPermitted: { const: false },
  },
  [
    "familyAllocationRecordId",
    "confirmatoryFamilyId",
    "decisionLineageId",
    "allocationLineageId",
    "allocationOrdinal",
    "provenance",
    "registrySnapshotDigest",
    "stableSlotUniverseDigest",
    "allocationPolicyDigest",
    "beaconEvidenceDigest",
    "predecessorAllocationDigest",
    "subjectArmMappingDigest",
    "denominatorDigest",
    "reviewerAllocationPlan",
    "rerollPermitted",
  ],
);

const reviewerCapacityRequest = root(
  "reviewer-capacity-request",
  {
    capacityRequestKey: digest(),
    capacityReservationId: id(),
    confirmatoryFamilyId: id(),
    allocationRecordDigest: digest(),
    cf05FenceDigest: digest(),
    proposalDigest: digest(),
    registryRootDigest: digest(),
    identityUnits: {
      type: "array",
      minItems: 1,
      items: closed({
        opaqueIdentityId: id(),
        unitCount: { type: "integer", minimum: 1 },
      }),
    },
    containsSlotOrder: { const: false },
    containsArmMap: { const: false },
    containsOutcome: { const: false },
  },
  [
    "capacityRequestKey",
    "capacityReservationId",
    "confirmatoryFamilyId",
    "allocationRecordDigest",
    "cf05FenceDigest",
    "proposalDigest",
    "registryRootDigest",
    "identityUnits",
    "containsSlotOrder",
    "containsArmMap",
    "containsOutcome",
  ],
);

const reviewerCapacityDisposition = root(
  "reviewer-capacity-disposition",
  {
    capacityRequestKey: digest(),
    capacityReservationId: id(),
    disposition: {
      enum: [
        "reserved_all_or_none",
        "denied_all_or_none",
        "source_terminalized_before_disposition",
        "execution_bound",
        "closed_reconciled",
      ],
    },
    registryRootDigest: digest(),
    grantedIdentityUnits: {
      type: "array",
      items: closed({
        opaqueIdentityId: id(),
        unitCount: { type: "integer", minimum: 1 },
      }),
    },
    deniedIdentityUnits: {
      type: "array",
      items: closed({
        opaqueIdentityId: id(),
        reason: id(),
      }),
    },
    familyTerminalDigest: { anyOf: [digest(), { type: "null" }] },
    noFutureInvocationProofDigest: { anyOf: [digest(), { type: "null" }] },
    exposureRetained: { type: "boolean" },
    changedRequestPermitted: { const: false },
    partialGrantPermitted: { const: false },
  },
  [
    "capacityRequestKey",
    "capacityReservationId",
    "disposition",
    "registryRootDigest",
    "grantedIdentityUnits",
    "deniedIdentityUnits",
    "familyTerminalDigest",
    "noFutureInvocationProofDigest",
    "exposureRetained",
    "changedRequestPermitted",
    "partialGrantPermitted",
  ],
);

export const ANALYTICAL_SCHEMA_CONTRACTS = deepFreeze({
  "analysis-plan.schema.json": analysisPlan,
  "analysis-result.schema.json": analysisResult,
  "dependence-plan.schema.json": dependencePlan,
  "agreement-report.schema.json": agreementReport,
  "review-aggregation.schema.json": reviewAggregation,
  "rubric.schema.json": rubric,
  "metric-descriptor.schema.json": metricDescriptor,
  "qualification-overlay.schema.json": qualificationOverlay,
  "recommendation.schema.json": recommendation,
  "calibration-corpus.schema.json": calibrationCorpus,
  "control-delta-audit.schema.json": controlDeltaAudit,
  "family-allocation-record.schema.json": familyAllocationRecord,
  "reviewer-allocation-plan.schema.json": reviewerAllocationPlan,
  "reviewer-capacity-request.schema.json": reviewerCapacityRequest,
  "reviewer-capacity-disposition.schema.json": reviewerCapacityDisposition,
});

export function analyticalSchemaContract(filename) {
  filename = stabilizeJson(filename);
  return ANALYTICAL_SCHEMA_CONTRACTS[filename] ?? null;
}
