import {
  attestation,
  closed,
  contract,
  countLedger,
  digest,
  digestArray,
  discriminated,
  identifier,
  identifiedContract,
  identifierArray,
  nonNegativeInteger,
  nullable,
  positiveInteger,
  probability,
  stateContract,
  text,
  textArray,
} from "./primitives.mjs";

const grantStatus = {
  enum: [
    "issued",
    "retirement_pending",
    "consumed",
    "terminalized_unconsumed",
    "quarantined",
  ],
};

const stoppingExecutionPlan = () => {
  const common = {
    stoppingExecutionPlanId: identifier(),
    stoppingRuleId: identifier(),
    stoppingRuleSemanticDigest: digest(),
    sampleUnit: { const: "scenario_stratum_arm_cell" },
    minimumAssignmentsPerCell: positiveInteger(),
    maximumAssignmentsPerCell: positiveInteger(),
    assignmentActivationClass: {
      const: "all_through_maximum_precommitted",
    },
    completionRule: {
      const: "all_assigned_terminal_at_maximum",
    },
    interimOutcomeLookOrdinals: {
      type: "array",
      items: positiveInteger(),
      maxItems: 0,
    },
    interimOutcomeLookCount: { const: 0 },
    outcomeResponsiveEarlyStoppingExecuted: { const: false },
    repeatedInspectionMethodExecuted: { const: false },
    terminalOutcomeAnalysisClass: { const: "post_completion_only" },
    immutable: { const: true },
    stoppingExecutionPlanDigest: digest(),
  };
  const fixedCompletion = contract({
    ...common,
    ruleClass: { const: "fixed_sample" },
    executionClass: { const: "fixed_completion" },
    inferenceClass: { const: "fixed_sample" },
  });
  const sequentialMaximumCompletion = contract({
    ...common,
    ruleClass: { const: "valid_sequential" },
    executionClass: { const: "sequential_max_completion" },
    inferenceClass: { const: "maximum_sample_nonsequential_only" },
    declaredInspectionSchedule: {
      type: "array",
      minItems: 1,
      maxItems: 1,
      uniqueItems: true,
      items: positiveInteger(),
    },
    declaredRepeatedInspectionMethodId: identifier(),
    declaredDecisionPolicyDigest: digest(),
    declaredOutcomeResponsiveStoppingPermitted: { const: true },
    sequentialEfficacyClaimSupported: { const: false },
  });
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      schemaVersion: fixedCompletion.properties.schemaVersion,
      hashProfileId: fixedCompletion.properties.hashProfileId,
      ...common,
      ruleClass: { enum: ["fixed_sample", "valid_sequential"] },
      executionClass: {
        enum: ["fixed_completion", "sequential_max_completion"],
      },
      inferenceClass: {
        enum: ["fixed_sample", "maximum_sample_nonsequential_only"],
      },
      declaredInspectionSchedule:
        sequentialMaximumCompletion.properties.declaredInspectionSchedule,
      declaredRepeatedInspectionMethodId: identifier(),
      declaredDecisionPolicyDigest: digest(),
      declaredOutcomeResponsiveStoppingPermitted: { type: "boolean" },
      sequentialEfficacyClaimSupported: { type: "boolean" },
    },
    required: [
      "schemaVersion",
      "hashProfileId",
      ...Object.keys(common),
      "ruleClass",
      "executionClass",
      "inferenceClass",
    ],
    oneOf: [fixedCompletion, sequentialMaximumCompletion],
  };
};

const terminalOutcome = discriminated("outcomeClass", {
  observed: {
    properties: {
      resultRoot: digest(),
      failureRoot: nullable(digest()),
    },
  },
  candidate_failure: {
    properties: {
      failureRoot: digest(),
      adverseMappingRoot: digest(),
    },
  },
  structural_missing: {
    properties: {
      missingnessRoot: digest(),
    },
  },
  unresolved_bounded: {
    properties: {
      lowerBound: { type: "number" },
      upperBound: { type: "number" },
      evidenceRoot: digest(),
    },
  },
});

const campaignState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "campaignId",
    machineId: "campaign",
    lifecycleManifest,
    properties: {
      surveyUniverseRoot: digest(),
      surveyReserveRoot: digest(),
      flowLedgerRoot: digest(),
      edlAuthorizationDigest: digest(),
      confirmatoryFamilyId: identifier(),
      familyAllocationDigest: digest(),
      familyExecutionCommitmentDigest: digest(),
      cf08AcknowledgementRoot: digest(),
      reviewerAllocationPlanDigest: digest(),
      downstream: discriminated("applicability", {
        not_required: {
          properties: {
            claimRequiresDownstream: { const: false },
          },
        },
        required: {
          properties: {
            claimRequiresDownstream: { const: true },
            taskUniverseRoot: digest(),
            semanticKeyRoot: digest(),
            reserveUniverseRoot: digest(),
            downstreamLedgerRoot: digest(),
          },
        },
      }),
      reviewerCapacityDispositionRoot: nullable(digest()),
      replacementBudgetLedgerRoot: digest(),
      awarenessUniverseRoot: digest(),
      awarenessReceiptLedgerRoot: digest(),
      unmaskStatus: {
        enum: ["masked", "grant_staged", "unmasked_for_registered_analysis"],
      },
      activationWindowRoot: digest(),
      childGrantFenceRegistryRoot: digest(),
      receiptLedgerRoot: digest(),
      failurePreparation: nullable(
        closed({
          cause: identifier(),
          sourcePhase: identifier(),
          sourceRoot: digest(),
          fence: positiveInteger(),
          realizedChildCutRoot: digest(),
          issuanceWindowsClosed: { const: true },
          activationWindowsClosed: { const: true },
          totalDrainRoot: digest(),
        }),
      ),
      attemptRefs: digestArray(),
    },
  });

const campaignFailureEnvelope = () =>
  identifiedContract("campaignFailureEnvelopeId", {
    campaignId: identifier(),
    sourcePhase: identifier(),
    failureCause: identifier(),
    readableSourceRoots: digestArray(),
    unavailableSourceClasses: identifierArray(),
    failurePreparationRoot: nullable(digest()),
    realizedChildCutRoot: digest(),
    positionDispositions: {
      type: "array",
      items: closed({
        positionId: identifier(),
        positionClass: {
          enum: ["assignment", "attempt", "review", "reserve", "capacity"],
        },
        disposition: {
          enum: [
            "terminal",
            "quarantined",
            "terminalized_unconsumed",
            "never_granted",
            "retired",
          ],
        },
        receiptRoot: digest(),
      }),
    },
    populationViews: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: closed({
        populationClass: {
          enum: [
            "all_assigned",
            "instrument_valid",
            "release_eligible",
          ],
        },
        assignmentCount: nonNegativeInteger(),
        observedCount: nonNegativeInteger(),
        missingCount: nonNegativeInteger(),
        failureCount: nonNegativeInteger(),
        contaminationCount: nonNegativeInteger(),
        denominatorDigest: digest(),
      }),
    },
    stagePopulationViews: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: closed({
        stage: { enum: ["survey", "downstream"] },
        populationClass: {
          enum: [
            "all_assigned",
            "instrument_valid",
            "release_eligible",
          ],
        },
        assignmentCount: nonNegativeInteger(),
        observedCount: nonNegativeInteger(),
        missingCount: nonNegativeInteger(),
        failureCount: nonNegativeInteger(),
        contaminationCount: nonNegativeInteger(),
        denominatorDigest: digest(),
      }),
    },
    denominatorReconciliationRoot: digest(),
    awarenessClosureRoot: digest(),
    receiptLedgerRoot: digest(),
    missingnessPolicyRoot: digest(),
    unsupportedClaimIds: identifierArray(),
    admissible: { const: false },
    defectRef: digest(),
    issuedOrRetirementPendingGrantsRemaining: { const: false },
  });

const admissionGrant = () =>
  identifiedContract("admissionGrantId", {
    campaignId: identifier(),
    operationClass: identifier(),
    targetMachineId: identifier(),
    targetObjectId: identifier(),
    immutableInputRoot: digest(),
    monotonicFence: positiveInteger(),
    failurePreparationFenceRoot: nullable(digest()),
    status: grantStatus,
    childDispositionReceiptRoot: nullable(digest()),
    parentReconciliationRoot: nullable(digest()),
    terminalizationLineageRoot: nullable(digest()),
  });

const operationGrantDisposition = () =>
  identifiedContract("operationGrantDispositionId", {
    campaignId: identifier(),
    admissionGrantId: nullable(identifier()),
    childMachineId: identifier(),
    childObjectId: identifier(),
    childRevision: nonNegativeInteger(),
    parentPendingStateRoot: digest(),
    parentOrderRoot: digest(),
    failureFenceRoot: nullable(digest()),
    source: discriminated("sourceClass", {
      issued_grant: {
        properties: {
          transitionClass: {
            enum: [
              "AT01",
              "AT03",
              "AT08a",
              "AT08b",
              "AT10",
              "AT11",
              "AR01",
              "AR04",
              "RV01",
              "RV04",
            ],
          },
          grantRoot: digest(),
        },
      },
      no_grant_child: {
        properties: {
          noGrantEvidenceRoot: digest(),
          verifiedAdmissionAbsent: { const: true },
        },
      },
    }),
    result: discriminated("disposition", {
      terminalized_unconsumed: {
        properties: {
          childEventRoot: digest(),
          resultingSemanticCoreRoot: digest(),
          parentReconciliationRoot: digest(),
        },
      },
      source_advanced: {
        properties: {
          currentChildStateRoot: digest(),
          sourceAdvancedReceiptRoot: digest(),
          parentReconciliationRoot: digest(),
        },
      },
    }),
  });

const terminalizationOrder = () =>
  identifiedContract("terminalizationOrderId", {
    campaignId: identifier(),
    parentTransitionId: identifier(),
    cause: identifier(),
    realizedChildCutRoot: digest(),
    targetMachineId: identifier(),
    targetObjectId: identifier(),
    expectedRevision: nonNegativeInteger(),
    monotonicFence: positiveInteger(),
    order: discriminated("orderClass", {
      child_admission_denial: {
        properties: { admissionDecisionRoot: digest() },
      },
      conditional_grant_retirement: {
        properties: {
          admissionGrantRoot: digest(),
          retirementConditionRoot: digest(),
        },
      },
      failure_total_drain: {
        properties: {
          failurePreparationRoot: digest(),
          terminalCutRoot: digest(),
        },
      },
      deterministic_no_subject: {
        properties: {
          noInvocationAwarenessOrderRoot: digest(),
          sourceAssignmentRoot: digest(),
        },
      },
      reserve_retirement: {
        properties: {
          reserveBlockRoot: digest(),
          activationWindowClosed: { const: true },
        },
      },
      review_no_work: {
        properties: {
          reason: {
            enum: [
              "admission_denied",
              "allocation_exhausted",
              "replacement_budget_exhausted",
            ],
          },
          noInvocationAwarenessOrderRoot: digest(),
        },
      },
    }),
    receiptContractDigest: digest(),
  });

const assignmentState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "assignmentId",
    machineId: "assignment",
    lifecycleManifest,
    properties: {
      assignmentClass: { enum: ["survey", "downstream"] },
      assignmentKind: { enum: ["primary", "reserve"] },
      sourceBindingRoot: digest(),
      reserveActivationRoot: nullable(digest()),
      reserveBlockReceiptRoot: nullable(digest()),
      operationGrantLedgerRoot: digest(),
      failureDrainOrderRoot: nullable(digest()),
      attemptRoots: digestArray(),
      closureReceiptRoot: nullable(digest()),
      deterministicNoSubjectOrderRoot: nullable(digest()),
      awarenessObligationRoot: digest(),
      awarenessParentReceiptRoot: nullable(digest()),
      retryPolicyRoot: digest(),
      stopPolicyRoot: digest(),
      failurePolicyRoot: digest(),
      terminalOutcome: nullable(terminalOutcome),
    },
  });

const reviewState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "reviewSlotId",
    machineId: "review-slot",
    lifecycleManifest,
    properties: {
      reviewPurpose: { enum: ["incident", "judge", "adjudication"] },
      confirmatoryFamilyId: identifier(),
      reviewerAllocationPlanDigest: digest(),
      stableSlotKey: identifier(),
      presentationRank: nonNegativeInteger(),
      identityCursorRoot: digest(),
      failureLedgerRoot: digest(),
      currentGrantRoot: nullable(digest()),
      replacementBudgetReservationRoot: nullable(digest()),
      failureDrainRoot: nullable(digest()),
      workOrderRoot: nullable(digest()),
      attemptRoots: digestArray(),
      contentResultRoot: nullable(digest()),
      awarenessObligationRoot: digest(),
      awarenessStateRoot: nullable(digest()),
      awarenessParentReceiptRoot: nullable(digest()),
      noWorkCause: nullable(identifier()),
      terminalResult: nullable(terminalOutcome),
    },
  });

const runState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "runId",
    machineId: "attempt",
    lifecycleManifest,
    properties: {
      assignmentId: identifier(),
      runtimeProductStateRoot: digest(),
      identityCursorRoot: digest(),
      subjectBindingRoot: digest(),
      admissionFailureFenceRoot: nullable(digest()),
      failureOrderRoot: nullable(digest()),
      failureSourceClass: nullable(identifier()),
      contentResultRoot: nullable(digest()),
      awarenessInvocationBindingRoot: nullable(digest()),
      awarenessDispatchProofRoot: nullable(digest()),
      noInvocationAwarenessOrderRoot: nullable(digest()),
      awarenessStateRoot: nullable(digest()),
      awarenessParentReceiptRoot: nullable(digest()),
      outcome: nullable(terminalOutcome),
    },
  });

const subjectBinding = () =>
  identifiedContract("subjectBindingId", {
    binding: discriminated("subjectClass", {
      survey_session: {
        properties: {
          assignmentId: identifier(),
          sessionId: identifier(),
          candidateSnapshotDigest: digest(),
          publicScenarioDigest: digest(),
        },
      },
      downstream_task: {
        properties: {
          assignmentId: identifier(),
          downstreamTaskId: identifier(),
          sourceSurveyAssignmentId: identifier(),
          artifactBinding: discriminated("artifactClass", {
            available: { properties: { artifactDigest: digest() } },
            source_artifact_unavailable: {
              properties: { sourceOutcomeRoot: digest() },
            },
          }),
        },
      },
      deterministic_no_subject: {
        properties: {
          assignmentId: identifier(),
          sourceEvidenceRoot: digest(),
          consumerInvoked: { const: false },
        },
      },
    }),
  });

const executionConfiguration = () => {
  const promptPlan = closed({
    promptTemplateId: identifier(),
    promptTemplateDigest: digest(),
  });
  const projectionPlan = closed({
    projectionPolicyId: identifier(),
    inputFieldNames: identifierArray({ minItems: 1 }),
    projectionPolicyDigest: digest(),
  });
  const budget = closed({
    maxInputBytes: positiveInteger(),
    maxOutputBytes: positiveInteger(),
    timeoutMs: positiveInteger(),
  });
  const workOrderPlan = closed({
    workOrderPolicyId: identifier(),
    purpose: identifier(),
    contentOutputSchemaId: identifier(),
    allowedTools: identifierArray(),
    networkPolicy: { enum: ["disabled", "allowlist"] },
    awarenessRequired: { type: "boolean" },
    budget,
    workOrderPolicyDigest: digest(),
  });
  const rolePlan = closed({
    roleClass: {
      enum: [
        "synthetic-director",
        "survey-executor",
        "downstream-consumer",
        "semantic-judge",
        "adjudicator",
      ],
    },
    promptPlan,
    projectionPlan,
    workOrderPlan,
    executionProfileDigest: digest(),
    rolePlanDigest: digest(),
  });
  const executionProfile = closed({
    roleClass: rolePlan.properties.roleClass,
    executionBoundary: {
      enum: ["test_only_in_process", "attested_host_isolation"],
    },
    provider: closed({
      providerId: identifier(),
      providerVersion: identifier(),
    }),
    model: closed({
      modelId: identifier(),
      modelVersion: identifier(),
    }),
    sampling: closed({
      strategyId: identifier(),
      deterministic: { type: "boolean" },
      seed: { type: "string", minLength: 1, maxLength: 4000 },
      temperature: { type: "number", minimum: 0, maximum: 2 },
      topP: {
        type: "number",
        exclusiveMinimum: 0,
        maximum: 1,
      },
      maxOutputTokens: positiveInteger(),
    }),
    toolCatalog: closed({
      toolCatalogId: identifier(),
      toolCatalogVersion: identifier(),
      toolIds: identifierArray(),
      toolCatalogDigest: digest(),
    }),
    runtime: closed({
      runtimeId: identifier(),
      runtimeVersion: identifier(),
      adapterId: identifier(),
      adapterVersion: identifier(),
    }),
    executionProfileDigest: digest(),
  });
  return identifiedContract("executionConfigurationId", {
    campaignId: identifier(),
    campaignSealDigest: digest(),
    assignmentMapDigest: digest(),
    stoppingExecutionPlanDigest: digest(),
    scenarioRoots: closed({
      authorityEnvelopeDigest: digest(),
      materialBundleDigests: digestArray({ minItems: 1 }),
    }),
    reviewerRoots: closed({
      reviewerAllocationPlanDigest: digest(),
      familyAllocationRecordDigest: digest(),
      reviewerRegistrySnapshotDigest: digest(),
      reviewerFamilyBindingRoot: digest(),
    }),
    controlRoots: closed({
      controlDeltaAuditDigest: digest(),
      controlAuditPolicyDigest: digest(),
    }),
    promptPlanRoot: digest(),
    projectionPlanRoot: digest(),
    workOrderPlanRoot: digest(),
    rolePlans: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: rolePlan,
    },
    roleExecutionProfiles: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: executionProfile,
    },
    roleExecutionProfileRoot: digest(),
    softwareRoots: closed({
      packageManifestRoot: digest(),
      evaluatorPackagePayloadRoot: digest(),
      compilerSourceRoot: digest(),
      compilerImplementationRoot: digest(),
      generatedProjectionRoot: digest(),
      subjectAdapterBindingRoot: digest(),
    }),
    immutable: { const: true },
    executionConfigurationDigest: digest(),
  });
};

const roleWorkOrder = () =>
  identifiedContract("workOrderId", {
    campaignId: identifier(),
    assignmentRef: identifier(),
    roleClass: {
      enum: [
        "synthetic-director",
        "survey-executor",
        "downstream-consumer",
        "incident-classifier",
        "semantic-judge",
        "adjudicator",
        "deterministic-analyst",
      ],
    },
    purpose: identifier(),
    leastContextProjectionDigest: digest(),
    inputProjectionDigest: digest(),
    contentOutputSchemaId: identifier(),
    allowedTools: identifierArray(),
    networkPolicy: { enum: ["disabled", "allowlist"] },
    expectedAwarenessKey: digest(),
    maskPolicyDigest: digest(),
    awarenessRegisteredBeforeDispatch: { const: true },
    budget: closed({
      maxInputBytes: positiveInteger(),
      maxOutputBytes: positiveInteger(),
      timeoutMs: positiveInteger(),
    }),
    familyBinding: nullable(
      closed({
        confirmatoryFamilyId: identifier(),
        reviewerPlanDigest: digest(),
        stableSlotKey: identifier(),
        presentationRank: nonNegativeInteger(),
        identityCursorRef: digest(),
      }),
    ),
    status: { const: "sealed" },
    immutable: { const: true },
    parentSealDigest: digest(),
    executionConfigurationDigest: digest(),
    awarenessRequired: { type: "boolean" },
    workOrderDigest: digest(),
  });

const metacognitiveResponse = closed({
  perceivedCondition: text(),
  confidence: text(),
  rationale: text(),
});

const roleResult = () =>
  contract(
    {
      roleOutputClass: {
        enum: [
          "synthetic_director_session",
          "survey_execution",
          "downstream_utility",
          "incident_attribution",
          "semantic_judge_ballot",
          "semantic_adjudication",
          "deterministic_analysis",
        ],
      },
      workOrderId: identifier(),
      status: { const: "completed" },
      sessionPlan: closed({
        prompt: text(),
        artifactContract: textArray(),
      }),
      metacognitiveResponse,
      artifact: closed({
        artifactId: identifier(),
        title: text(),
        sections: {
          type: "array",
          items: closed({
            sectionId: identifier(),
            text: text(),
          }),
        },
      }),
      utility: closed({
        taskId: identifier(),
        taskCompleted: { type: "boolean" },
        findings: textArray(),
      }),
      incidentFinding: closed({
        incidentClass: identifier(),
        confidence: probability(),
        citations: textArray(),
      }),
      ballot: closed({
        ballotId: identifier(),
        scores: {
          type: "object",
          additionalProperties: { type: "number" },
        },
        overall: { type: "number" },
        rationale: text(),
      }),
      resolution: closed({
        resolutionId: identifier(),
        items: {
          type: "array",
          items: closed({
            dimensionId: identifier(),
            selectedScore: { type: "number" },
            sealedValues: { type: "array", items: { type: "number" } },
            dissentPreserved: { const: true },
          }),
        },
        disagreementCount: nonNegativeInteger(),
      }),
      analysis: closed({
        analysisResultDigest: digest(),
        summary: text(),
      }),
    },
    ["roleOutputClass", "workOrderId", "status"],
    {
      allOf: [
        {
          if: {
            properties: {
              roleOutputClass: { const: "synthetic_director_session" },
            },
          },
          then: { required: ["sessionPlan"] },
        },
        {
          if: {
            properties: { roleOutputClass: { const: "survey_execution" } },
          },
          then: { required: ["artifact", "metacognitiveResponse"] },
        },
        {
          if: {
            properties: { roleOutputClass: { const: "downstream_utility" } },
          },
          then: { required: ["utility", "metacognitiveResponse"] },
        },
        {
          if: {
            properties: { roleOutputClass: { const: "incident_attribution" } },
          },
          then: { required: ["incidentFinding", "metacognitiveResponse"] },
        },
        {
          if: {
            properties: {
              roleOutputClass: { const: "semantic_judge_ballot" },
            },
          },
          then: { required: ["ballot", "metacognitiveResponse"] },
        },
        {
          if: {
            properties: {
              roleOutputClass: { const: "semantic_adjudication" },
            },
          },
          then: { required: ["resolution", "metacognitiveResponse"] },
        },
        {
          if: {
            properties: {
              roleOutputClass: { const: "deterministic_analysis" },
            },
          },
          then: { required: ["analysis"] },
        },
      ],
    },
  );

const awarenessObligation = () =>
  identifiedContract("awarenessObligationId", {
    expectedUniverseKey: digest(),
    roleClass: identifier(),
    purpose: identifier(),
    contentSchemaId: identifier(),
    expectedInvocation: { type: "boolean" },
    parentBindingRoot: digest(),
    workOrderRef: nullable(digest()),
    parentGrantObservation: nullable(
      closed({
        admissionGrantId: identifier(),
        parentOrderRoot: digest(),
        fence: positiveInteger(),
        consumed: { const: false },
      }),
    ),
    maskPolicyDigest: digest(),
    responseTimeoutMs: positiveInteger(),
    parentReceiptContractDigest: digest(),
    registrationNoticeGating: { const: false },
  });

const awarenessInvocationBinding = () =>
  identifiedContract("awarenessInvocationBindingId", {
    awarenessObligationId: identifier(),
    workOrderDigest: digest(),
    capabilityDigest: digest(),
    parentGrantOrOrderRoot: digest(),
    parentFence: positiveInteger(),
    intendedRoleId: identifier(),
    maskPolicyDigest: digest(),
    awarenessSealerAcknowledgementRoot: digest(),
    parentDispatchPermitted: { const: true },
  });

const awarenessRequest = () =>
  identifiedContract("awarenessRequestId", {
    awarenessObligationId: identifier(),
    contentCommitDigest: digest(),
    roleId: identifier(),
    guess: discriminated("guessClass", {
      reported_guess: {
        properties: { perceivedCondition: text() },
      },
      unknown: {
        properties: { reason: text() },
      },
    }),
    stillMaskedAttestation: attestation(),
    issuedCapabilityDigest: digest(),
    sequence: positiveInteger(),
    contentWriteCapability: { const: false },
  });

const awarenessResponse = () =>
  identifiedContract("awarenessResponseId", {
    awarenessObligationId: identifier(),
    awarenessRequestId: identifier(),
    contentCommitDigest: digest(),
    response: discriminated("responseClass", {
      reported_guess: {
        properties: {
          perceivedCondition: text(),
          confidence: probability(),
          cueRefs: digestArray(),
        },
      },
      unknown: {
        properties: {
          confidence: probability(),
          cueRefs: digestArray(),
        },
      },
    }),
    contentMutationCapability: { const: false },
  });

const awarenessDisposition = () =>
  identifiedContract("awarenessDispositionId", {
    awarenessObligationId: identifier(),
    disposition: discriminated("dispositionClass", {
      reported: {
        properties: {
          contentCommitDigest: digest(),
          requestDigest: digest(),
          responseDigest: digest(),
          visibilityAttestationDigest: digest(),
          orderProofDigest: digest(),
        },
      },
      missing_after_content: {
        properties: {
          contentCommitDigest: digest(),
          timeoutEvidenceRoot: digest(),
          orderProofDigest: digest(),
        },
      },
      missing_no_content: {
        properties: {
          noContentEvidenceRoot: digest(),
          noInvocationOrderRoot: digest(),
        },
      },
      not_applicable: {
        properties: {
          applicabilityEvidenceRoot: digest(),
          expectedInvocation: { const: false },
        },
      },
    }),
    contentMutationAuthority: { const: false },
    exclusionAuthority: { const: false },
  });

const awarenessParentReceipt = () =>
  identifiedContract("awarenessParentReceiptId", {
    parent: discriminated("parentClass", {
      assignment: { properties: { assignmentId: identifier() } },
      run: { properties: { runId: identifier() } },
      review: { properties: { reviewSlotId: identifier() } },
    }),
    parentRevision: nonNegativeInteger(),
    awarenessDispositionDigest: digest(),
    inclusionClass: {
      enum: ["included", "missing_after_content", "no_content", "not_applicable"],
    },
    acknowledgementRequestDigest: digest(),
    contentMutationAuthority: { const: false },
    scoringMutationAuthority: { const: false },
  });

const awarenessLedger = () =>
  identifiedContract("awarenessLedgerId", {
    expectedUniverseKeys: digestArray(),
    awarenessStateRoots: digestArray(),
    parentReceiptRoots: digestArray(),
    dispositionCounts: countLedger([
      "reported",
      "missingAfterContent",
      "missingNoContent",
      "notApplicable",
    ]),
    recomputationProofDigest: digest(),
    appendOnly: { const: true },
  });

const awarenessState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "awarenessObligationId",
    machineId: "awareness",
    lifecycleManifest,
    properties: {
      obligationDigest: digest(),
      invocationBindingDigest: nullable(digest()),
      invocationAcknowledgementDigest: nullable(digest()),
      parentDispatchProofDigest: nullable(digest()),
      contentCommitDigest: nullable(digest()),
      requestDigest: nullable(digest()),
      responseDigest: nullable(digest()),
      dispositionDigest: nullable(digest()),
      parentReceiptDigest: nullable(digest()),
      parentAcknowledgementDigest: nullable(digest()),
    },
  });

const protectedUnmaskGrant = () =>
  identifiedContract("protectedUnmaskGrantId", {
    campaignId: identifier(),
    campaignEvidenceEnvelopeDigest: digest(),
    awarenessUniverseRoot: digest(),
    closedAwarenessLedgerRoot: digest(),
    dispositionCounts: countLedger([
      "reported",
      "missingAfterContent",
      "missingNoContent",
      "notApplicable",
    ]),
    protectedArmMapDigest: digest(),
    analystScope: closed({
      analysisPlanRef: identifier(),
      registeredDimensions: identifierArray({ minItems: 1 }),
      fixtureOnly: { type: "boolean" },
    }),
    expectedObligationIds: identifierArray(),
    roots: {
      type: "array",
      items: closed({
        obligationId: identifier(),
        awarenessStateRoot: digest(),
        disposition: {
          enum: [
            "reported",
            "missing_after_content",
            "missing_no_content",
            "not_applicable",
          ],
        },
      }),
    },
    unmaskFence: positiveInteger(),
    transitionId: { const: "EC20" },
    grantCoreDigest: digest(),
    containsFutureReference: { const: false },
  });

const protectedUnmaskGrantDisposition = () =>
  identifiedContract("protectedUnmaskGrantDispositionId", {
    campaignId: identifier(),
    protectedUnmaskGrantId: identifier(),
    grantCoreDigest: digest(),
    disposition: {
      enum: ["consumed", "terminalized_unconsumed"],
    },
    dispositionCauseRoot: digest(),
    campaignEventRoot: nullable(digest()),
    failurePreparationRoot: nullable(digest()),
    sourcePhase: identifier(),
    liveAuthorityRemaining: { const: false },
    dispositionReceiptRoot: digest(),
  });

const surveySubjectExecution = () =>
  identifiedContract("subjectExecutionId", {
    assignmentRef: identifier(),
    adapterId: identifier(),
    adapterDescriptorDigest: digest(),
    runtimeSemanticsAuthority: {
      const: "supplied-host-binding",
    },
    nativeRuntimeSemanticsClaimed: { const: false },
    candidateSnapshotId: identifier(),
    candidatePackageRoot: digest(),
    stageReceipt: closed({
      replayed: { type: "boolean" },
      stagedSkillRoot: text(),
      skillIdentity: identifier(),
      candidateSnapshotId: identifier(),
      candidatePackageRoot: digest(),
      adapterDescriptorDigest: digest(),
    }),
    initialObservationDigest: digest(),
    coldResumeVerifiedStateRoot: digest(),
    actionReceiptDigests: digestArray(),
    directorHistory: {
      type: "array",
      items: closed({
        observationDigest: digest(),
        actionId: identifier(),
        actionClass: identifier(),
        actionAccepted: { type: "boolean" },
        eventRoot: digest(),
      }),
    },
    terminalObservation: closed({
      schemaVersion: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
      hashProfileId: { const: "survey-evaluator-sha256-jcs-v1" },
      adapterId: identifier(),
      adapterInterfaceVersion: {
        type: "string",
        pattern: "^\\d+\\.\\d+\\.\\d+$",
      },
      sessionRef: identifier(),
      phase: text(),
      revision: nonNegativeInteger(),
      subjectStateRoot: digest(),
      eventRoots: digestArray(),
      terminalClass: {
        enum: ["completed", "aborted", "failed", "quarantined"],
      },
      directorView: nullable({
        type: "object",
        additionalProperties: true,
      }),
      envelopeRef: nullable(digest()),
    }),
    terminalObservationDigest: digest(),
    outcomeClass: {
      enum: ["completed", "aborted", "failed", "quarantined"],
    },
    outcomeAttribution: {
      enum: ["observed_success", "unresolved"],
    },
    artifact: nullable({
      type: "object",
      additionalProperties: true,
    }),
    artifactRawSha256: nullable(digest()),
    artifactSemanticDigest: nullable(digest()),
    immutable: { const: true },
    subjectExecutionDigest: digest(),
  });

const telemetryEvent = () =>
  identifiedContract("telemetryEventId", {
    runId: identifier(),
    observedAt: { type: "string", format: "date-time" },
    eventClass: {
      enum: ["model", "provider", "tool", "process", "resource"],
    },
    providerId: nullable(identifier()),
    toolId: nullable(identifier()),
    metricName: identifier(),
    nativeValue: { type: "number" },
    nativeUnit: identifier(),
    evidenceRoot: digest(),
    privateReasoningIncluded: { const: false },
  });

const visibilityAttestation = () =>
  identifiedContract("visibilityAttestationId", {
    workOrderId: identifier(),
    actualPromptDigest: digest(),
    actualFilesystemSurfaceRoot: digest(),
    actualToolSurfaceRoot: digest(),
    actualNetworkSurfaceRoot: digest(),
    actualCredentialSurfaceRoot: digest(),
    expectedVisibilityPolicyDigest: digest(),
    comparison: {
      enum: ["matches", "narrower_than_expected", "policy_violation"],
    },
    findingRefs: digestArray(),
    hostAttestation: attestation(),
  });

const roleAttemptEvidence = () =>
  identifiedContract("roleAttemptEvidenceId", {
    workOrderId: identifier(),
    invocationStatus: {
      enum: ["invoked_content_committed", "invoked_no_content", "not_invoked"],
    },
    roleResultDigest: nullable(digest()),
    awarenessStateDigest: digest(),
    awarenessDispositionDigest: digest(),
    awarenessParentReceiptDigest: digest(),
    visibilityAttestationDigest: digest(),
    contentBeforeAwarenessProofDigest: nullable(digest()),
    sourceMutation: { const: false },
  });

const runEvidence = () =>
  identifiedContract("runEvidenceId", {
    assignmentId: identifier(),
    runId: identifier(),
    assignmentClass: { enum: ["survey", "downstream"] },
    observableInputRoot: digest(),
    observableOutputRoot: nullable(digest()),
    stateRoot: digest(),
    telemetryRoots: digestArray(),
    failureRoot: nullable(digest()),
    isolationEvidenceRoot: digest(),
    roleAttemptEvidenceRoot: digest(),
    invocationDisposition: {
      enum: ["content_committed", "no_content", "not_invoked"],
    },
    contentBeforeAwarenessProofRoot: nullable(digest()),
  });

const conformanceObservation = () =>
  identifiedContract("conformanceObservationId", {
    sourceObjectId: identifier(),
    checkId: identifier(),
    result: { enum: ["pass", "fail", "not_observable"] },
    severity: { enum: ["info", "warning", "blocking"] },
    evidenceRefs: digestArray(),
    affectedDimensionIds: identifierArray(),
  });

const incidentObservation = () =>
  identifiedContract("incidentObservationId", {
    sourceObjectId: identifier(),
    observationClass: { enum: ["objective", "ambiguous"] },
    incidentClass: identifier(),
    classificationEvidenceRefs: digestArray(),
    downstreamMetricEffects: {
      type: "array",
      items: closed({
        metricId: identifier(),
        effect: {
          enum: [
            "candidate_adverse",
            "structural_missing",
            "unresolved",
            "none",
          ],
        },
      }),
    },
  });

const incidentBallot = () =>
  identifiedContract("incidentBallotId", {
    incidentObservationId: identifier(),
    judgeAssignmentId: identifier(),
    attribution: identifier(),
    confidence: probability(),
    citations: digestArray(),
    contentCommitSequence: positiveInteger(),
    contentDigest: digest(),
    blindEvidenceRoot: digest(),
  });

const incidentAdjudication = () =>
  identifiedContract("incidentAdjudicationId", {
    incidentObservationId: identifier(),
    rawBallotRoots: digestArray({ minItems: 2 }),
    selectedAttribution: identifier(),
    dissentPreserved: { const: true },
    dissentRoots: digestArray(),
    contentCommitSequence: positiveInteger(),
    contentDigest: digest(),
  });

const judgingBundle = () =>
  identifiedContract("judgingBundleId", {
    bundlePurpose: { enum: ["incident", "semantic", "downstream"] },
    bundleLocalCommitmentRoot: digest(),
    frozenEvidenceProjectionRoot: digest(),
    semanticKeyOrRubricRoot: digest(),
    derivationRoot: digest(),
    armMapIncluded: { const: false },
  });

const judgeBallot = () =>
  identifiedContract("judgeBallotId", {
    judgingBundleId: identifier(),
    judgeAssignmentId: identifier(),
    scores: {
      type: "array",
      items: closed({
        dimensionId: identifier(),
        value: { type: "number" },
        citations: digestArray(),
        confidence: probability(),
      }),
    },
    blindEvidenceRoot: digest(),
    contentCommitSequence: positiveInteger(),
    contentDigest: digest(),
  });

const adjudication = () =>
  identifiedContract("adjudicationId", {
    disagreementIds: identifierArray({ minItems: 1 }),
    evidenceConsideredRoots: digestArray(),
    resolutions: {
      type: "array",
      items: closed({
        disagreementId: identifier(),
        selectedValue: { anyOf: [{ type: "number" }, text()] },
        rationale: text(),
      }),
    },
    dissentPreserved: { const: true },
    dissentRoots: digestArray(),
    adjudicatorId: identifier(),
    contentCommitSequence: positiveInteger(),
    contentDigest: digest(),
  });

const downstreamTask = () =>
  identifiedContract("downstreamTaskId", {
    sourceSurveyAssignmentId: identifier(),
    taskText: text(),
    artifactRule: discriminated("bindingClass", {
      artifact_or_no_artifact_itt: {
        properties: {
          artifactAvailableRuleDigest: digest(),
          unavailableOutcomeClass: { const: "source_artifact_unavailable" },
        },
      },
      no_artifact_required: {
        properties: {
          noArtifactEvidenceRuleDigest: digest(),
        },
      },
    }),
    allowedTools: identifierArray(),
    budget: closed({
      timeoutMs: positiveInteger(),
      maxOutputBytes: positiveInteger(),
    }),
    outputContractDigest: digest(),
    scoreContractDigest: digest(),
    blindToArm: { const: true },
  });

const downstreamResult = () =>
  identifiedContract("downstreamResultId", {
    sourceSurveyAssignmentId: identifier(),
    result: discriminated("resultClass", {
      consumer_result: {
        properties: {
          sourceArtifactDigest: digest(),
          workOrderDigest: digest(),
          outputDigest: digest(),
          telemetryRoots: digestArray(),
          contentCommitDigest: digest(),
          failureRoot: nullable(digest()),
        },
      },
      source_artifact_unavailable: {
        properties: {
          sourceOutcomeRoot: digest(),
          consumerInvoked: { const: false },
        },
      },
      campaign_failed_before_source_freeze: {
        properties: {
          campaignFailureEnvelopeRoot: digest(),
          consumerInvoked: { const: false },
        },
      },
    }),
    attributionStatus: { enum: ["not_required", "pending"] },
  });

const evaluatorAssuranceCertificate = () =>
  identifiedContract("evaluatorAssuranceCertificateId", {
    evaluatorPackageDigest: digest(),
    gateEvidence: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: closed({
        gateId: { type: "string", pattern: "^E[0-7]$" },
        gateEvidenceRoot: digest(),
      }),
    },
    useClass: {
      enum: ["development", "pilot", "confirmatory", "release_assurance"],
    },
    expiresAt: { type: "string", format: "date-time" },
    driftConditionDigest: digest(),
    verdict: { enum: ["certified", "denied", "withdrawn"] },
    issuerAttestation: attestation(),
    releaseAuthority: { const: false },
  });

const campaignLineageDisclosure = () =>
  identifiedContract("campaignLineageDisclosureId", {
    campaignId: identifier(),
    confirmatoryFamilyId: identifier(),
    familyOrdinal: positiveInteger(),
    analysisResultDigest: digest(),
    campaignEvidenceEnvelopeDigest: digest(),
    protectedUnmaskGrantDigest: digest(),
    disclosurePolicyDigest: digest(),
    disclosureRecipeDigest: digest(),
    allowedFieldRoot: digest(),
    boundedAggregatesRoot: digest(),
    limitsRoot: digest(),
    envelopeBoundOneWay: { const: true },
    participantArmMapIncluded: { const: false },
    rawRoleContentIncluded: { const: false },
    releaseAuthority: { const: false },
  });

export const EXECUTION_SCHEMA_FACTORIES = Object.freeze({
  "stopping-execution-plan.schema.json": stoppingExecutionPlan,
  "campaign-state.schema.json": campaignState,
  "campaign-failure-envelope.schema.json": campaignFailureEnvelope,
  "admission-grant.schema.json": admissionGrant,
  "operation-grant-disposition.schema.json": operationGrantDisposition,
  "terminalization-order.schema.json": terminalizationOrder,
  "assignment-state.schema.json": assignmentState,
  "review-state.schema.json": reviewState,
  "run-state.schema.json": runState,
  "subject-binding.schema.json": subjectBinding,
  "execution-configuration.schema.json": executionConfiguration,
  "role-work-order.schema.json": roleWorkOrder,
  "role-result.schema.json": roleResult,
  "awareness-obligation.schema.json": awarenessObligation,
  "awareness-invocation-binding.schema.json": awarenessInvocationBinding,
  "awareness-request.schema.json": awarenessRequest,
  "awareness-response.schema.json": awarenessResponse,
  "awareness-disposition.schema.json": awarenessDisposition,
  "awareness-parent-receipt.schema.json": awarenessParentReceipt,
  "awareness-ledger.schema.json": awarenessLedger,
  "awareness-state.schema.json": awarenessState,
  "protected-unmask-grant.schema.json": protectedUnmaskGrant,
  "protected-unmask-grant-disposition.schema.json":
    protectedUnmaskGrantDisposition,
  "survey-subject-execution.schema.json":
    surveySubjectExecution,
  "telemetry-event.schema.json": telemetryEvent,
  "visibility-attestation.schema.json": visibilityAttestation,
  "role-attempt-evidence.schema.json": roleAttemptEvidence,
  "run-evidence.schema.json": runEvidence,
  "conformance-observation.schema.json": conformanceObservation,
  "incident-observation.schema.json": incidentObservation,
  "incident-ballot.schema.json": incidentBallot,
  "incident-adjudication.schema.json": incidentAdjudication,
  "judging-bundle.schema.json": judgingBundle,
  "judge-ballot.schema.json": judgeBallot,
  "adjudication.schema.json": adjudication,
  "downstream-task.schema.json": downstreamTask,
  "downstream-result.schema.json": downstreamResult,
  "evaluator-assurance-certificate.schema.json":
    evaluatorAssuranceCertificate,
  "campaign-lineage-disclosure.schema.json": campaignLineageDisclosure,
});
