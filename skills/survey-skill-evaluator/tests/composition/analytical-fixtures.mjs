const HASH_PROFILE_ID = "survey-evaluator-sha256-jcs-v1";
const digests = Array.from({ length: 20 }, (_, index) =>
  (index + 1).toString(16).repeat(64).slice(0, 64),
);

const base = () => ({
  schemaVersion: "1.0.0",
  hashProfileId: HASH_PROFILE_ID,
});

export function agreementReportFixture() {
  return {
    ...base(),
    agreementReportId: "agreement-1",
    purpose: "semantic",
    scale: "ordinal",
    method: "krippendorff_alpha",
    estimate: 0.8,
    status: "estimated",
    interval: {
      lower: 0.6,
      upper: 0.9,
      confidence: 0.95,
      simultaneous: false,
      method: "cluster_bootstrap",
    },
    unitCount: 10,
    ratingCount: 20,
    judgeCount: 2,
    dependencePlanDigest: digests[0],
    preAdjudication: true,
    evidenceRefs: [digests[1]],
  };
}

export function reviewAggregationFixture() {
  return {
    ...base(),
    reviewAggregationId: "review-aggregation-1",
    purpose: "semantic",
    expectedSlotIds: ["slot-1", "slot-2"],
    validResultIds: ["result-1", "result-2"],
    failedSlotIds: [],
    unusedCapacityIds: [],
    minimumValidCount: 2,
    minimumValidSatisfied: true,
    agreementReportDigest: digests[0],
    measurementStatus: "judgeable",
    adjudicationTriggered: false,
    triggerReasonIds: [],
    disagreementIds: [],
    rawBallotsPreserved: true,
    armMapConsumed: false,
  };
}

export function rubricFixture() {
  return {
    ...base(),
    rubricId: "semantic-rubric-1",
    purpose: "survey_semantic",
    semanticKeyDigest: digests[0],
    dimensions: [
      {
        dimensionId: "intent_preservation",
        obligationIds: ["intent_atom"],
        nativeScale: "ordinal",
        anchors: [
          { value: 0, meaning: "Required intent is absent." },
          { value: 1, meaning: "Required intent is preserved." },
        ],
        weight: 1,
        citationRequired: true,
        missingRule: "not_judgeable",
      },
    ],
    fixedExposureDenominators: [
      { dimensionId: "intent_preservation", denominator: 1 },
    ],
    evidenceRefs: [digests[1]],
  };
}

export function metricDescriptorFixture() {
  return {
    ...base(),
    metricId: "SEMANTIC_INTENT_ATOMS",
    dimension: "semantic",
    nativeRepresentation: "anchored ordinal obligation score",
    nativeUnit: "ordinal_score",
    direction: "higher-is-better",
    denominatorClass: "obligation_exposure",
    missingMapping: "not_judgeable",
    failureMapping: "registered_adverse",
    aggregationRecipeId: "fixed_exposure_obligation_summary",
    attentionEconomicClass: "none",
    primaryEligible: true,
    evidenceRefs: [digests[0]],
  };
}

export function qualificationOverlayFixture() {
  return {
    ...base(),
    qualificationOverlayId: "qualification-1",
    purpose: "execution_qualification",
    frozenEvidenceDigest: digests[0],
    attributionDigest: digests[1],
    sourceResultIds: ["result-1"],
    mappings: [
      {
        metricResultId:
          "SEMANTIC_INTENT_ATOMS:candidate",
        metricId: "SEMANTIC_INTENT_ATOMS",
        armId: "candidate",
        sourceClass: "candidate_failure",
        effect: "candidate_adverse",
        eligible: true,
        lowerBound: null,
        upperBound: null,
        evidenceRefs: [digests[2]],
      },
    ],
    sourceEvidenceMutated: false,
  };
}

export function controlDeltaAuditFixture() {
  return {
    ...base(),
    controlDeltaAuditId: "control-audit-1",
    treatmentSnapshotDigest: digests[0],
    controlSnapshotDigest: digests[1],
    manipulatedMechanismId: "EM03",
    allowedDifferencePaths: ["$.mechanism.mode"],
    observedDifferencePaths: ["$.mechanism.mode"],
    forbiddenDifferencePaths: [],
    forbiddenDoctrineTerms: ["single-question treatment"],
    doctrineLeakTerms: [],
    commonContractDigest: digests[2],
    manipulationChecks: [
      {
        checkId: "mode_differs",
        passed: true,
        evidenceRefs: [digests[3]],
      },
    ],
    expectedDirectionVisibleToAuditor: false,
    passed: true,
  };
}

export function analysisPlanFixture() {
  return {
    ...base(),
    analysisPlanId: "analysis-plan-1",
    preregistrationDigest: digests[0],
    claimIds: ["claim-1"],
    primaryMetricIds: ["SEMANTIC_INTENT_ATOMS"],
    secondaryMetricIds: [],
    diagnosticMetricIds: ["ATTENTION_TOIL"],
    targetPopulation: "all_assigned_trials",
    stratumWeights: [{ stratumId: "all", weight: 1 }],
    dependencePlanDigest: digests[1],
    estimand: {
      estimandId: "semantic_itt",
      treatmentArmId: "opaque-a",
      controlArmId: "opaque-b",
      analysisUnit: "sealed_block",
      contrastFunction: "blocked_mean_difference",
      supportedConclusion: "Difference in semantic preservation for assigned trials.",
    },
    missingness: {
      lowerBound: 0,
      upperBound: 1,
      candidateFailureMapping: "candidate_adverse",
      exogenousMissingRule: "bounded_structural_missing",
      sensitivityRecipeIds: ["pattern_mixture_v1"],
      completeCasePrimaryForbidden: true,
    },
    inference: {
      method: "cluster_bootstrap",
      confidence: 0.95,
      resampleCount: 1000,
      convergenceTolerance: 0.05,
      seedCommitmentDigest: digests[2],
    },
    multiplicity: {
      familyId: "confirmatory-family-1",
      purpose: "confirmatory_causal",
      procedure: "holm",
      alpha: 0.05,
    },
    agreement: {
      minimumValidBallots: 2,
      scaleMethod: "krippendorff_alpha",
      adjudicationPolicyDigest: digests[3],
    },
    ranking: {
      guardrailIds: ["valid_evidence"],
      usePareto: true,
      rankIntervalConfidence: 0.95,
      tieRecipeId: "non_dominating_front",
      weightedPolicyId: null,
    },
    attentionProtection: {
      minimizeOnlyToil: true,
      learningInvestmentAdverse: false,
      directorStrategicJudgmentAdverse: false,
      unresolvedExcluded: true,
    },
    recommendationPolicyDigest: digests[4],
  };
}

function populationView(populationClass, digest) {
  return {
    populationClass,
    assignmentCount: 4,
    observedCount: 4,
    missingCount: 0,
    failureCount: 0,
    contaminationCount: 0,
    denominatorDigest: digest,
  };
}

export function analysisResultFixture() {
  return {
    ...base(),
    analysisResultId: "analysis-result-1",
    analysisPlanDigest: digests[0],
    campaignEvidenceEnvelopeDigest: digests[1],
    protectedUnmaskGrantDigest: digests[2],
    dependencePlanDigest: digests[3],
    softwareDigest: digests[4],
    populationViews: [
      populationView("all_assigned", digests[5]),
      populationView("instrument_valid", digests[6]),
      populationView("release_eligible", digests[7]),
    ],
    metricResults: [
      {
        metricResultId:
          "SEMANTIC_INTENT_ATOMS:candidate-a",
        metricId: "SEMANTIC_INTENT_ATOMS",
        armId: "candidate-a",
        nativeUnit: "score",
        status: "observed",
        value: 0.8,
        lower: 0.6,
        upper: 0.9,
        evidenceRefs: [digests[8]],
      },
    ],
    effects: [
      {
        effectId: "semantic-effect-1",
        metricId: "SEMANTIC_INTENT_ATOMS",
        estimandId: "semantic_itt",
        status: "estimated",
        estimate: 0.2,
        interval: {
          lower: 0.05,
          upper: 0.35,
          confidence: 0.95,
          simultaneous: true,
          method: "max_t",
        },
        practicalClass: "superior",
        effectiveClusterCounts: [{ factorId: "block", count: 4 }],
      },
    ],
    multiplicityResult: {
      procedure: "holm",
      strongFwerControlled: true,
      adjustedFindingIds: ["semantic-effect-1"],
    },
    missingnessResults: [
      {
        metricId: "SEMANTIC_INTENT_ATOMS",
        denominatorDigest: digests[10],
        treatmentAssignmentCount: 2,
        treatmentObservedCount: 2,
        treatmentMissingCount: 0,
        treatmentFailureCount: 0,
        controlAssignmentCount: 2,
        controlObservedCount: 2,
        controlMissingCount: 0,
        controlFailureCount: 0,
        treatmentMissingRate: 0,
        controlMissingRate: 0,
        lowerContrastBound: 0.05,
        upperContrastBound: 0.35,
      },
    ],
    ranking: {
      nonDominatedCandidateIds: ["candidate-a"],
      candidateRankResults: [
        {
          candidateId: "candidate-a",
          medianRank: 1,
          lowerRank: 1,
          upperRank: 1,
          proportionRankedBest: 1,
        },
      ],
      totalOrderSupported: true,
    },
    attention: {
      toilResultIds: ["toil-1"],
      protectedLearningResultIds: ["learning-1"],
      directorJudgmentResultIds: ["judgment-1"],
      unresolvedObservationIds: [],
      protectedLearningCanWorsenSelection: false,
    },
    sensitivityResultIds: ["sensitivity-1"],
    derivationRecordDigests: [digests[9]],
    campaignLineageDisclosureDigest: null,
  };
}

export function recommendationFixture() {
  return {
    ...base(),
    recommendationId: "recommendation-1",
    analysisResultDigest: digests[0],
    recommendationPolicyDigest: digests[1],
    class: "recommend_accept_with_guardrails",
    supportedClaimIds: ["claim-1"],
    dimensionalResultIds: ["semantic-effect-1"],
    guardrailIds: ["monitor_missingness"],
    limitationIds: ["pilot_scope_only"],
    sensitivityResultIds: ["sensitivity-1"],
    attentionProof: {
      toilOnlyAdverse: true,
      learningInvestmentAdverse: false,
      directorJudgmentAdverse: false,
      unresolvedAttentionExcluded: true,
    },
    policyClauses: [
      {
        clauseId: "minimum_semantic_effect",
        passed: true,
        evidenceRefs: [digests[2]],
      },
    ],
    promotionAuthorized: false,
  };
}

export function calibrationCorpusFixture() {
  return {
    ...base(),
    calibrationCorpusId: "calibration-corpus-1",
    version: "v1",
    stewardAuthorityId: "calibration_steward",
    consentPolicyDigest: digests[0],
    deidentificationPolicyDigest: digests[1],
    protectionClass: "protected_calibration",
    calibrationCohortDigest: digests[2],
    holdoutCohortDigest: digests[3],
    holdoutPolicy: {
      mode: "single_use",
      exposureDomainKey: digests[4],
    },
    driftDimensions: ["semantic", "efficiency"],
    driftEvidenceRefs: [digests[5]],
    retentionPolicyDigest: digests[6],
  };
}
