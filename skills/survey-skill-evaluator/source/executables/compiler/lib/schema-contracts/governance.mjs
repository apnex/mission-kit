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
  immutableEvidence,
  nonNegativeInteger,
  nullable,
  positiveInteger,
  predecessor,
  probability,
  stateContract,
  text,
  textArray,
  lifecycleStates,
} from "./primitives.mjs";

const rootArray = (extra = {}) => ({
  type: "array",
  items: digest(),
  uniqueItems: true,
  ...extra,
});

const safeRelativeReference = () => ({
  type: "string",
  minLength: 1,
  pattern: "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[^\\\\\\u0000]+$",
});

const inventoryEntry = closed({
  path: { type: "string", pattern: "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$)).+$" },
  mode: { enum: ["0644", "0755"] },
  byteLength: nonNegativeInteger(),
  rawFileSha256: digest(),
});

const productState = () =>
  identifiedContract("productStateId", {
    machineId: identifier(),
    phaseRuntime: discriminated("semanticPhase", {
      dormant: {
        properties: {
          runtimeStatus: { const: "not_started" },
          rejoinRule: { const: "admit_from_sealed_predecessor" },
        },
      },
      active: {
        properties: {
          runtimeStatus: {
            enum: ["ready", "executing", "suspended", "recoverable"],
          },
          rejoinRule: { const: "verify_authoritative_root_and_cursor" },
        },
      },
      terminal: {
        properties: {
          runtimeStatus: { enum: ["closed", "failed", "quarantined"] },
          rejoinRule: { const: "read_only" },
        },
      },
    }),
    transitionId: identifier(),
    authoritativeStateRoot: digest(),
  });

const authorityTrustRoot = () =>
  identifiedContract("trustRootId", {
    sourceClass: { const: "external_host_trust_root" },
    issuers: {
      type: "array",
      minItems: 1,
      items: closed({
        issuerId: identifier(),
        publicKeySpkiBase64: {
          type: "string",
          minLength: 40,
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
        },
        authorityIds: identifierArray({ minItems: 1 }),
      }),
    },
    trustRootDigest: digest(),
  });

const authorityReceiptRecord = () =>
  identifiedContract("receiptId", {
    trustRootId: identifier(),
    issuerId: identifier(),
    authorityId: identifier(),
    commandScopeDigest: digest(),
    evidenceRoot: digest(),
    receiptDigest: digest(),
    signatureBase64url: {
      type: "string",
      minLength: 40,
      pattern: "^[A-Za-z0-9_-]+$",
    },
  });

const authorityReceipt = () => authorityReceiptRecord();

const reviewerRegistryStewardAttestation = () =>
  closed({
    authorityId: {
      const: "reviewer-registry-steward",
    },
    statementDigest: digest(),
    authorityReceipt: authorityReceiptRecord(),
  });

const e0BaselineEvidence = () =>
  identifiedContract("e0EvidenceId", {
    gate: { const: "E0" },
    evidenceStatus: {
      const: "frozen_development_prerequisites_only",
    },
    governanceIdentities: closed({
      surveyV2DesignSha256: {
        const:
          "6467fff1c74c6dc857bcb06722d19dfa04381ae3e6f242eccb36581f87560f74",
      },
      surveyV2ProjectionRefinementSha256: {
        const:
          "d91bb7617f0428e8520bba1f33d1cb25b8eca1560196c665310aed8ba745ffb3",
      },
      surveyV2CandidateCommit: {
        const: "a9e569415d9bb07da097ea6b5e84821ed888279f",
      },
      evaluatorDesignSha256: {
        const:
          "3b333b6d1ff385ef5ca47460b42708f9c3f97692de7ecea846f467c776abdf7f",
      },
      evaluatorIntentSha256: {
        const:
          "b26695ff5dd8334c4ae58f44c698578331d0a06da92de5262bc4eaa3debd6746",
      },
      missionKitBaselineHead: {
        const: "035b8d2e96d4b3c32ca6a4260d11846c7f6b1491",
      },
      implementationErratumSha256: {
        const:
          "397e18c7d8e4c4d06699b8520f776f6e285b3cfce1eeb779b24f3412d3bbeb26",
      },
    }),
    canonicalV1Control: closed({
      skillSha256: {
        const:
          "3e0ce4576667f9d03371585556da1717c3e567d9b0fa289241f8ea0037050218",
      },
      surveyInitTestSha256: {
        const:
          "f5b260cf08a14fb17f655e91e6588ad1c8bce03673e503d763d1f401383df40c",
      },
      pickPresentationTestSha256: {
        const:
          "89523ee175993c331e078ae09a087d958cbb645d4fc6e2a59169bc14991e41b9",
      },
      envelopeValidatorTestSha256: {
        const:
          "c3e47864bd1da4e9862d2ca8c3ef74090a87a9e8af020b1572ed4fc6f74a3d34",
      },
      characterizationAssertionCount: { const: 53 },
      mutationPermitted: { const: false },
    }),
    candidateV2Prerequisite: closed({
      packagePath: { const: "skills/survey-v2" },
      minimumMechanicalGate: { const: "G0_G5" },
      terminalRatificationEvidenceModel: {
        const: "detached_candidate_then_terminal_attestation",
      },
      mechanicalEvidence: closed({
        packageDigest: {
          const:
            "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c",
        },
        projectionLockRawSha256: {
          const:
            "2067e9081b4b4047e357c6c6ba85ad257c8cea8676b452f342c0a6f743d09aad",
        },
        testManifestRawSha256: {
          const:
            "b9f059f3509986f080d2b65d7c187cfd2a8b07a76485fdc2bf01e69b04a9cb74",
        },
        mechanicalGateRange: { const: "G0_G5" },
        registeredTestCount: { const: 63 },
        passedTestCount: { const: 63 },
        failedTestCount: { const: 0 },
        testRunner: { const: "npm_test" },
        testExitCode: { const: 0 },
        testOutputEvidence: closed({
          kind: { const: "deterministic_normalized_summary" },
          path: {
            const:
              "source/evidence/survey-v2-a9e5694-test-summary.json",
          },
          rawSha256: {
            const:
              "fda7578050075bfe232369179d3f0bda4633802f34ecd8b4cdf0f43c3127f0d8",
          },
          byteLength: { const: 307 },
        }),
        nodeVersion: { const: "v24.12.0" },
        status: { const: "pass" },
        mechanicalEvidenceRoot: {
          const:
            "b9cd8991a5bb8f70ac1a38003c4310ece19ed701ea44238362aea91261de6abc",
        },
      }),
    }),
    evaluatorPackagePrerequisite: closed({
      inventorySource: { const: "package.manifest.json" },
      dependencySource: { const: "package-lock.json" },
      externalPackageIdentityRequired: { const: true },
      selfExcludingManifestRequired: { const: true },
    }),
    dependencies: {
      type: "array",
      minItems: 2,
      items: closed({
        dependencyId: identifier(),
        requirement: text(),
        authorityPath: text(),
      }),
    },
    threatModel: {
      type: "array",
      minItems: 16,
      items: closed({
        threatId: {
          enum: [
            "allocation_grinding",
            "early_or_unscoped_unmask",
            "composite_result_mutation",
            "incomplete_awareness_universe",
            "db_precommit_dispatch",
            "db_peer_reveal",
            "db_result_forgery",
            "missing_or_rewritten_source_request",
            "wrong_target_source_request",
            "authority_spoofing",
            "forged_or_late_grant_fence_result",
            "missingness_driven_exclusion",
            "hidden_retry",
            "stale_or_duplicate_grant",
            "double_family_consumption",
            "caller_self_asserted_lifecycle_authority",
          ],
        },
        attackSurface: text(),
        failClosedControl: text(),
        evidenceRefs: textArray({ minItems: 1 }),
      }),
    },
    assuranceBoundary: closed({
      deterministicCeiling: { const: "E5" },
      e6Claimed: { const: false },
      e7Claimed: { const: false },
      promotionAuthorized: { const: false },
    }),
    evidenceRoot: digest(),
  });

const scenarioState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "scenarioId",
    machineId: "scenario-authoring-entry",
    lifecycleManifest,
    properties: {
      acceptedEventRefs: digestArray(),
      rejectedEventRefs: digestArray(),
      semanticCursor: digest(),
      cohortUseReceiptRefs: digestArray(),
      sealedScenarioRoot: nullable(digest()),
      sealedLatentIntentRoot: nullable(digest()),
      sealedSemanticKeyRoots: digestArray(),
      projectionOnly: { const: true },
    },
  });

const scenarioBankState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "scenarioBankId",
    machineId: "scenario-cohort-use",
    lifecycleManifest,
    properties: {
      scenarioEntryRoots: digestArray(),
      exposureDomainIndexRoot: digest(),
      cohortUseIdempotencyIndexRoot: digest(),
      reusableBudgetAccountsRoot: digest(),
      debitLedgerRoot: digest(),
      conflictTombstoneRoot: digest(),
      wholeLedgerQuarantineRef: nullable(digest()),
      refundsPermitted: { const: false },
    },
  });

const scenarioCohortUse = () =>
  identifiedContract("cohortUseId", {
    exposureDomainKey: digest(),
    candidateLineageId: identifier(),
    confirmatoryFamilyId: identifier(),
    authorizationDigest: digest(),
    scenarioSemanticRoot: digest(),
    semanticKeyRoot: digest(),
    cohortRoot: digest(),
    usePolicyRoot: digest(),
    preTransitionLedgerRoot: digest(),
    use: discriminated("mode", {
      single_use: {
        properties: {
          useOrdinal: { const: 1 },
          permanentlyConsumed: { const: true },
        },
      },
      reusable_holdout: {
        properties: {
          reusableBudgetKey: digest(),
          useOrdinal: positiveInteger(),
          debitUnits: positiveInteger(),
          remainingUnits: nonNegativeInteger(),
        },
      },
    }),
    stewardAttestation: attestation(),
    outboxSuppliesEventAndSemanticRoots: { const: true },
    refundPermitted: { const: false },
  });

const evaluationDecisionLineageIdentity = () =>
  identifiedContract("decisionLineageId", {
    releaseDecisionKey: digest(),
    useClass: {
      enum: ["confirmatory", "pilot", "exploratory", "assurance"],
    },
    consequenceClass: {
      enum: ["release", "deployment", "policy", "research_only"],
    },
    claimFamilyId: identifier(),
    estimandFamilyId: identifier(),
    targetPopulationId: identifier(),
    administrativeFieldsExcluded: { const: true },
    implementationRevisionsExcluded: { const: true },
    allocationRevisionsExcluded: { const: true },
  });

const evaluationDecisionLineageState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "decisionLineageId",
    machineId: "evaluation-decision-lineage",
    lifecycleManifest,
    properties: {
      identityDigest: digest(),
      policyDigests: digestArray(),
      nextFamilyOrdinal: positiveInteger(),
      authorizationLedger: {
        type: "array",
        items: closed({
          authorizationId: identifier(),
          familyOrdinal: positiveInteger(),
          tokenStatus: {
            enum: [
              "issued",
              "retirement_pending",
              "bound",
              "terminalized_unconsumed",
            ],
          },
          receiptRoot: nullable(digest()),
        }),
      },
      allocationLineageRoots: digestArray(),
      reservedEvidenceBudget: nonNegativeInteger(),
      reservedMultiplicityBudget: nonNegativeInteger(),
      campaignIntakeLedgerRoot: digest(),
      familyTerminalLedgerRoot: digest(),
      conflictTombstoneRoot: digest(),
      inclusiveAnalysisRoot: nullable(digest()),
      wholeLineageQuarantineRef: nullable(digest()),
    },
  });

const familyRevisionAuthorization = () =>
  identifiedContract("familyRevisionAuthorizationId", {
    decisionLineageId: identifier(),
    predecessorFamilyIdentityDigest: digest(),
    proposedFamilyIdentityDigest: digest(),
    stableDecisionIdentityEqual: { const: true },
    derivedFieldDeltaDigest: digest(),
    revisionRelation: {
      enum: ["initial", "compatible_revision", "material_revision"],
    },
    outcomeVisibility: { const: "none" },
    armMapVisibility: { const: "none" },
    externalAuthorityAttestation: attestation(),
    familyOrdinal: positiveInteger(),
    allocationDisposition: {
      enum: ["fresh", "copy_compatible", "inherit_schedule"],
    },
    reservedEvidenceBudget: nonNegativeInteger(),
    futureBeaconScheduleItemDigest: digest(),
    cf01TokenDigest: digest(),
    tokenSingleUse: { const: true },
  });

const familyAuthorizationDisposition = () =>
  identifiedContract("familyAuthorizationDispositionId", {
    decisionLineageId: identifier(),
    authorizationId: identifier(),
    expectedLineageRevision: nonNegativeInteger(),
    familyRootQueryDigest: digest(),
    fence: nonNegativeInteger(),
    result: discriminated("disposition", {
      terminalized_unconsumed: {
        properties: {
          tokenDigest: digest(),
          edl08ReconciliationRoot: digest(),
        },
      },
      source_advanced: {
        properties: {
          tokenDigest: digest(),
          familyId: identifier(),
          familyRoot: digest(),
          cf01ReceiptRoot: digest(),
          edl08ReconciliationRoot: digest(),
        },
      },
    }),
  });

const lineageEntry = discriminated("entryClass", {
  bound_family_edl05: {
    properties: {
      familyOrdinal: positiveInteger(),
      authorizationDigest: digest(),
      familyTerminalReceiptRoot: digest(),
      campaignIntakeRoots: digestArray(),
      capacityClosureRoots: digestArray(),
    },
  },
  unbound_edl08: {
    properties: {
      familyOrdinal: positiveInteger(),
      authorizationDigest: digest(),
      terminalizedUnconsumedReceiptRoot: digest(),
      adverseBudgetDebit: positiveInteger(),
    },
  },
});

const lineageAnalysis = () =>
  identifiedContract("lineageAnalysisId", {
    decisionLineageId: identifier(),
    inclusiveCutOrdinal: nonNegativeInteger(),
    authorizationCutRoot: digest(),
    entries: { type: "array", items: lineageEntry, minItems: 1 },
    campaignDeliveryLedgerRoot: digest(),
    attachmentTerminalReceiptRoot: digest(),
    capacityClosureLedgerRoot: digest(),
    reservedBudgetAccountingRoot: digest(),
    multiplicityAccountingRoot: digest(),
    comparability: discriminated("mode", {
      separate: { properties: { reason: text() } },
      pooled: {
        properties: {
          comparabilityProofDigest: digest(),
          heterogeneityAnalysisDigest: digest(),
        },
      },
    }),
    outcomeAwareSelectionDisclosed: { type: "boolean" },
    supportedConclusions: textArray(),
    analystWorkOrderDigest: digest(),
    engineResultCoreDigest: digest(),
    analystAttestationOverEngineCore: attestation(),
  });

const lineageHandoffIndex = () =>
  identifiedContract("lineageHandoffIndexId", {
    decisionLineageId: identifier(),
    preEdl06StateRoot: digest(),
    closureAuthorizationDigest: digest(),
    completeCutDigest: digest(),
    lineageAnalysisDigest: digest(),
    ordinalTerminalReceiptRoots: digestArray(),
    campaignIntakeDeliveryRoots: digestArray(),
    attachmentTerminalReceiptRoots: digestArray(),
    reviewerCapacityClosureRoots: digestArray(),
    reservedBudgetAccountingRoot: digest(),
    multiplicityAccountingRoot: digest(),
    campaignHandoffRoots: digestArray(),
    disclosureRoots: digestArray(),
    limitPolicyDigest: digest(),
    releaseAuthority: { const: false },
  });

const confirmatoryFamilyIdentity = () =>
  identifiedContract("confirmatoryFamilyId", {
    decisionLineageId: identifier(),
    decisionPurpose: {
      enum: [
        "confirmatory_causal",
        "release_assurance",
        "candidate_selection",
        "equivalence",
      ],
    },
    candidateSnapshotDigest: digest(),
    controlSnapshotDigest: digest(),
    claimDigest: digest(),
    contrastDigest: digest(),
    targetPopulationDigest: digest(),
    scenarioKeySetDigest: digest(),
    metricSetDigest: digest(),
    dependencePlanDigest: digest(),
    analysisPlanDigest: digest(),
    allocationPolicyDigest: digest(),
    replacementBudgetPolicyDigest: digest(),
    methodologyDigest: digest(),
    evaluatorIdentityDigest: digest(),
    semanticAncestryRoot: digest(),
    administrativeFieldsExcluded: { const: true },
  });

const confirmatoryFamilyState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "confirmatoryFamilyId",
    machineId: "confirmatory-family",
    lifecycleManifest,
    properties: {
      decisionLineageId: identifier(),
      authorizationDigest: digest(),
      familyOrdinal: positiveInteger(),
      identityDigest: digest(),
      allocationProvenance: {
        enum: ["fresh", "copied_compatible", "inherited_schedule"],
      },
      allocationRecordDigest: nullable(digest()),
      attachmentOrderRoot: digest(),
      executionProposalFenceRoot: nullable(digest()),
      capacityDispositionRoot: nullable(digest()),
      soleExecutionCommitmentRoot: nullable(digest()),
      campaignAcknowledgementRoot: nullable(digest()),
      attachmentTerminalLedgerRoot: digest(),
      withdrawalAuthorizationRoot: nullable(digest()),
      terminalDispositionRoot: nullable(digest()),
    },
  });

const confirmatoryFamilyAttachment = () =>
  identifiedContract("familyAttachmentId", {
    campaignId: identifier(),
    confirmatoryFamilyId: identifier(),
    exactIdentityProofDigest: digest(),
    position: { enum: ["active", "standby", "read_only"] },
    attachment: discriminated("attachmentClass", {
      preseed: {
        properties: {
          ancestryRoot: digest(),
        },
      },
      preallocation_inherited: {
        properties: {
          predecessorAllocationDigest: digest(),
          ancestryRoot: digest(),
        },
      },
      post_allocation: {
        properties: {
          localAllocationDigest: digest(),
          ancestryRoot: digest(),
        },
      },
    }),
    acceptance: discriminated("status", {
      accepted: { properties: { receiptRoot: digest() } },
      rejected: { properties: { rejectionReason: text() } },
    }),
  });

const familyExecutionCommitment = () =>
  identifiedContract("familyExecutionCommitmentId", {
    confirmatoryFamilyId: identifier(),
    cf05ProposalFenceRoot: digest(),
    capacityRequestDigest: digest(),
    assignmentUniverseRoot: digest(),
    denominatorRoot: digest(),
    reviewerPlanRoot: digest(),
    rc01GrantRoot: digest(),
    rc02BindingRequestId: identifier(),
    familyFence: nonNegativeInteger(),
    rc02AcknowledgementRoot: digest(),
    campaignEc04ReceiptRoot: digest(),
    cf08AcknowledgementRoot: digest(),
    soleActiveConsumer: { const: true },
  });

const familyCampaignDisposition = () =>
  identifiedContract("familyCampaignDispositionId", {
    campaignId: identifier(),
    confirmatoryFamilyId: identifier(),
    campaignStateRoot: digest(),
    familyStateRoot: digest(),
    result: discriminated("disposition", {
      preterminal: {
        properties: {
          cause: {
            enum: ["awaiting_execution", "campaign_failure_preparing"],
          },
        },
      },
      execution_terminal: {
        properties: {
          handoffStatus: { enum: ["accepted", "rejected"] },
          terminalEvidenceRoot: digest(),
        },
      },
      campaign_cas_terminal: {
        properties: {
          cause: { enum: ["campaign_failed", "campaign_cancelled"] },
          terminalEvidenceRoot: digest(),
        },
      },
      source_advanced_family_terminal: {
        properties: {
          familyTerminalRoot: digest(),
          noMutationAcknowledgement: { const: true },
        },
      },
    }),
    containsOutcomeValues: { const: false },
    edlAuthority: { const: false },
  });

const familyWithdrawalAuthorization = () =>
  identifiedContract("familyWithdrawalAuthorizationId", {
    externalReleaseAuthorityId: identifier(),
    confirmatoryFamilyId: identifier(),
    decisionLineageId: identifier(),
    familyOrdinal: positiveInteger(),
    familyStateRoot: digest(),
    allocationDigest: nullable(digest()),
    authorization: discriminated("withdrawalClass", {
      ordinary_unconsumed_cf10a: {
        properties: {
          reason: {
            enum: [
              "external_withdrawal",
              "campaign_cancelled_before_execution",
            ],
          },
        },
      },
      orphaned_cf10b: {
        properties: {
          reason: {
            enum: ["allocation_orphaned", "authorization_source_advanced"],
          },
          orphanEvidenceRoot: digest(),
        },
      },
    }),
    noRefund: { const: true },
    noReplacement: { const: true },
    noExecution: { const: true },
    releaseEffect: { const: false },
  });

const familyTerminalDisposition = () =>
  identifiedContract("familyTerminalDispositionId", {
    confirmatoryFamilyId: identifier(),
    decisionLineageId: identifier(),
    familyOrdinal: positiveInteger(),
    terminal: discriminated("terminalClass", {
      cff01_preseed_exhausted: {
        properties: { exhaustionEvidenceRoot: digest() },
      },
      cff02_reviewer_capacity_denied: {
        properties: { capacityDenialRoot: digest() },
      },
      cf09_campaign_quarantine: {
        properties: { campaignQuarantineRoot: digest() },
      },
      cf10a_withdrawn_unconsumed: {
        properties: { withdrawalAuthorizationRoot: digest() },
      },
      cf10b_orphan_withdrawn: {
        properties: { withdrawalAuthorizationRoot: digest() },
      },
      cf11_execution_commit_failed: {
        properties: {
          failureClass: {
            enum: ["execution_commit_failed", "execution_commit_abandoned"],
          },
          failureEvidenceRoot: digest(),
        },
      },
      family_quarantine: {
        properties: { quarantineRoot: digest() },
      },
    }),
    attachmentTerminalNoticeRoots: digestArray(),
    allocationEvidenceRoot: nullable(digest()),
    consumerEvidenceRoot: nullable(digest()),
    campaignEvidenceRoot: nullable(digest()),
    containsOutcomeValues: { const: false },
  });

const familyAttachmentTerminalDelivery = () =>
  identifiedContract("attachmentTerminalDeliveryId", {
    familyAttachmentId: identifier(),
    campaignId: identifier(),
    sourceEventRoot: digest(),
    sourceSemanticRoot: digest(),
    advisorySourceObservationRoot: digest(),
    terminalNoticeRoot: digest(),
    receipt: discriminated("receiptClass", {
      campaign_cas_terminal: {
        properties: {
          campaignTerminalReceiptRoot: digest(),
          route: { enum: ["ECF02", "ECF03", "campaign_quarantine"] },
        },
      },
      source_advanced_already_terminal: {
        properties: {
          currentCampaignRoot: digest(),
          noMutation: { const: true },
        },
      },
      source_advanced_attachment_revised: {
        properties: {
          currentAttachmentRevision: nonNegativeInteger(),
          retirementRoot: digest(),
        },
      },
    }),
    replayIdentityDigest: digest(),
    parentBindingProofDigest: digest(),
    noOutcomeValues: { const: true },
    edlAuthority: { const: false },
  });

const assuranceState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "assuranceId",
    machineId: "evaluator-assurance",
    lifecycleManifest,
    properties: {
      evaluatorPackageDigest: digest(),
      consumedOperationGrantRoot: nullable(digest()),
      gateEvidenceRoots: digestArray(),
      failedGateId: nullable(identifier()),
      priorAssuranceRoot: nullable(digest()),
      certificateRoot: nullable(digest()),
      revocationRoot: nullable(digest()),
      defectRoot: nullable(digest()),
      invalidationLineageRoot: nullable(digest()),
      admissionEligibility: {
        enum: ["ineligible", "eligible", "permanently_denied"],
      },
      runtimeStatus: {
        enum: ["unassessed", "provisional", "certified", "terminal"],
      },
      resultReceiptExcludedFromSemanticCore: { const: true },
    },
  });

const gateEvidence = () =>
  identifiedContract("gateEvidenceId", {
    gateId: { type: "string", pattern: "^E[0-7]$" },
    evaluatorPackageDigest: digest(),
    methodologyDigest: digest(),
    inputRoots: digestArray({ minItems: 1 }),
    verdict: { enum: ["pass", "fail"] },
    findings: {
      type: "array",
      items: closed({
        findingId: identifier(),
        severity: { enum: ["info", "warning", "blocking"] },
        passed: { type: "boolean" },
        evidenceRefs: digestArray(),
      }),
    },
    issuerAttestation: attestation(),
  });

const assuranceIssueRequest = () =>
  identifiedContract("assuranceIssueRequestId", {
    evaluatorPackageDigest: digest(),
    gateEvidenceRoots: {
      type: "array",
      items: closed({
        gateId: { type: "string", pattern: "^E[0-7]$" },
        evidenceRoot: digest(),
      }),
      minItems: 8,
      maxItems: 8,
    },
    requestedUseClass: {
      enum: ["development", "pilot", "confirmatory", "release_assurance"],
    },
    conflictAttestationRoots: digestArray(),
    issuerWorkOrderDigest: digest(),
  });

const issuerTrustPolicy = () =>
  identifiedContract("issuerTrustPolicyId", {
    policySequence: positiveInteger(),
    issuers: {
      type: "array",
      minItems: 1,
      items: closed({
        issuerId: identifier(),
        publicKey: text(),
        scopes: identifierArray({ minItems: 1 }),
        validFrom: { type: "string", format: "date-time" },
        expiresAt: { type: "string", format: "date-time" },
      }),
    },
    certificateRulesDigest: digest(),
    rotationPolicyDigest: digest(),
    revocationIndexRoot: digest(),
  });

const issuerRevocation = () =>
  identifiedContract("issuerRevocationId", {
    certificateId: identifier(),
    effectiveTrustSequence: positiveInteger(),
    issuerId: identifier(),
    predecessorPolicyRoot: digest(),
    reason: discriminated("reasonClass", {
      key_compromise: { properties: { incidentEvidenceRoot: digest() } },
      policy_withdrawal: { properties: { authorityEvidenceRoot: digest() } },
      e6_failure: { properties: { assuranceFailureRoot: digest() } },
      e7_failure: { properties: { assuranceFailureRoot: digest() } },
      certificate_defect: { properties: { defectRoot: digest() } },
    }),
    issuerAttestation: attestation(),
  });

const trustState = () =>
  identifiedContract("trustLedgerId", {
    revision: nonNegativeInteger(),
    ledgerState: { enum: ["active", "quarantined"] },
    policyRoot: digest(),
    revocationIndexRoot: digest(),
    operationFenceIndexRoot: digest(),
    pendingInvalidationIndexRoot: digest(),
    assuranceMirrorRoot: digest(),
    childAdmissionLedgerRoot: digest(),
    predecessor: predecessor(),
    eventRefs: digestArray(),
    outboxRefs: digestArray(),
    quarantineRef: nullable(digest()),
  });

const assuranceOperationGrant = () =>
  identifiedContract("assuranceOperationGrantId", {
    assuranceId: identifier(),
    expectedAssuranceRevision: nonNegativeInteger(),
    sourceState: identifier(),
    targetState: identifier(),
    operation: {
      enum: ["EA06", "EA07", "EA08", "EA09", "EAF01g", "EAF01h"],
    },
    reasonClass: identifier(),
    issuerAttestation: attestation(),
    trustAttestation: attestation(),
    evidenceRoots: digestArray(),
    certificateRoot: nullable(digest()),
    revocationRoot: nullable(digest()),
    monotonicFence: positiveInteger(),
    pendingInvalidationEffect: {
      enum: ["none", "set", "clear", "absorb_terminal"],
    },
  });

const assuranceOperationReceipt = () =>
  identifiedContract("assuranceOperationReceiptId", {
    assuranceOperationGrantId: identifier(),
    assuranceId: identifier(),
    observedRevision: nonNegativeInteger(),
    outcome: discriminated("receiptClass", {
      accepted: {
        properties: {
          resultingRevision: nonNegativeInteger(),
          resultingState: identifier(),
          predecessorRoot: digest(),
          eventRoot: digest(),
          resultingSemanticCoreRoot: digest(),
          admissionEligibility: {
            enum: ["ineligible", "eligible", "permanently_denied"],
          },
        },
      },
      source_lost: {
        properties: {
          rejectionClass: {
            enum: ["revision_advanced", "terminal_absorbed", "unverifiable"],
          },
          observedStateRoot: digest(),
          reconciliationStatus: {
            enum: ["required", "complete", "source_unverifiable"],
          },
        },
      },
    }),
  });

const assuranceInvalidationDisposition = ({ lifecycleManifest }) =>
  identifiedContract("assuranceInvalidationDispositionId", {
    assuranceId: identifier(),
    invalidationEvidenceRoot: digest(),
    disposition: discriminated("dispositionClass", {
      source_valid_follow_on_grant: {
        properties: {
          operationGrantRoot: digest(),
          monotonicFence: positiveInteger(),
        },
      },
      absorbed_terminal_invalidation: {
        properties: {
          terminalState: {
            enum: lifecycleStates(
              lifecycleManifest,
              "evaluator-assurance",
            ).filter((state) => /^EA(?:9|10)_/u.test(state)),
          },
          terminalReceiptRoot: digest(),
          terminalStateRoot: digest(),
        },
      },
    }),
    evidencePreserved: { const: true },
    admissionPermanentlyDenied: { const: true },
  });

const trustAdmissionDecision = () =>
  identifiedContract("trustAdmissionDecisionId", {
    campaignId: identifier(),
    childOperationId: identifier(),
    requestDigest: digest(),
    certificateRoot: digest(),
    policyRoot: digest(),
    trustRevision: nonNegativeInteger(),
    assuranceMirrorRoot: digest(),
    decision: discriminated("decisionClass", {
      allow: {
        properties: {
          childAdmissionFence: positiveInteger(),
          certificateExpiresAt: { type: "string", format: "date-time" },
        },
      },
      deny: {
        properties: {
          denialReason: {
            enum: [
              "untrusted_issuer",
              "expired",
              "revoked",
              "pending_invalidation",
              "terminal_assurance",
              "fence_conflict",
            ],
          },
          permanent: { type: "boolean" },
        },
      },
    }),
  });

const campaign = () =>
  identifiedContract("campaignId", {
    purpose: {
      enum: [
        "confirmatory",
        "pilot",
        "exploratory",
        "calibration",
        "assurance",
      ],
    },
    claimIds: identifierArray({ minItems: 1 }),
    targetPopulationIds: identifierArray({ minItems: 1 }),
    armIds: identifierArray({ minItems: 2 }),
    scenarioIds: identifierArray({ minItems: 1 }),
    scenarioCohortUseReceiptRoots: digestArray({ minItems: 1 }),
    useClass: identifier(),
    ownerAuthorityId: identifier(),
    decisionLineageId: identifier(),
    familyRevisionAuthorizationDigest: digest(),
    confirmatoryFamilyIdentityDigest: digest(),
    familyAttachmentDigest: digest(),
  });

const campaignInput = () =>
  identifiedContract("campaignId", {
    useClass: {
      enum: [
        "diagnostic",
        "calibration",
        "pilot",
        "exploratory",
        "confirmatory",
        "assurance",
      ],
    },
    claims: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: closed({
        claimId: identifier(),
        text: text(),
        claimClass: {
          enum: [
            "upgrade-effect",
            "absolute-leverage",
            "variant-selection",
            "mechanism-attribution",
            "robustness",
            "efficiency",
            "downstream-utility",
          ],
        },
        treatmentArmId: identifier(),
        controlArmId: identifier(),
      }),
    },
    arms: {
      type: "array",
      minItems: 2,
      uniqueItems: true,
      items: closed({
        armId: identifier(),
        conditionClass: identifier(),
        environmentDigest: digest(),
        snapshotRef: safeRelativeReference(),
      }),
    },
    scenarioRefs: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: safeRelativeReference(),
    },
    population: closed({
      target: identifier(),
      strata: {
        type: "array",
        uniqueItems: true,
        items: closed({
          stratumId: identifier(),
          weight: probability(),
        }),
      },
    }),
    controlAuditPolicy: closed({
      treatmentArmId: identifier(),
      controlArmId: identifier(),
      manipulatedMechanismId: identifier(),
      allowedDifferencePaths: {
        type: "array",
        uniqueItems: true,
        items: {
          type: "string",
          pattern: "^\\$(?:\\.[A-Za-z0-9_-]+|\\[[0-9]+\\])*$",
        },
      },
      forbiddenDifferencePaths: {
        type: "array",
        uniqueItems: true,
        items: {
          type: "string",
          pattern: "^\\$(?:\\.[A-Za-z0-9_-]+|\\[[0-9]+\\])*$",
        },
      },
      forbiddenDoctrineTerms: {
        type: "array",
        uniqueItems: true,
        items: { type: "string", minLength: 1, maxLength: 256 },
      },
      expectedDirectionVisibleToAuditor: { const: false },
    }),
    analysisPlanRef: safeRelativeReference(),
    dependencePlanRef: safeRelativeReference(),
    stoppingRuleRef: safeRelativeReference(),
    promotionAuthorized: { const: false },
  });

const stoppingRule = () => {
  const fixedSample = contract({
    ruleId: identifier(),
    ruleClass: { const: "fixed_sample" },
    sampleUnit: { const: "scenario_stratum_arm_cell" },
    minimumAssignmentsPerCell: nonNegativeInteger(),
    maximumAssignmentsPerCell: nonNegativeInteger(),
    completionRule: { const: "all_assigned_terminal" },
    outcomeResponsiveStoppingPermitted: { const: false },
  });
  const validSequential = contract({
    ruleId: identifier(),
    ruleClass: { const: "valid_sequential" },
    sampleUnit: { const: "scenario_stratum_arm_cell" },
    minimumAssignmentsPerCell: positiveInteger(),
    maximumAssignmentsPerCell: positiveInteger(),
    inspectionSchedule: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: positiveInteger(),
    },
    repeatedInspectionMethodId: identifier(),
    decisionPolicyDigest: digest(),
    outcomeResponsiveStoppingPermitted: { const: true },
  });
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      schemaVersion: fixedSample.properties.schemaVersion,
      hashProfileId: fixedSample.properties.hashProfileId,
      ruleId: identifier(),
      ruleClass: { enum: ["fixed_sample", "valid_sequential"] },
      sampleUnit: { const: "scenario_stratum_arm_cell" },
      minimumAssignmentsPerCell: nonNegativeInteger(),
      maximumAssignmentsPerCell: nonNegativeInteger(),
      completionRule: { const: "all_assigned_terminal" },
      inspectionSchedule: validSequential.properties.inspectionSchedule,
      repeatedInspectionMethodId: identifier(),
      decisionPolicyDigest: digest(),
      outcomeResponsiveStoppingPermitted: { type: "boolean" },
    },
    required: [
      "schemaVersion",
      "hashProfileId",
      "ruleId",
      "ruleClass",
      "sampleUnit",
      "minimumAssignmentsPerCell",
      "maximumAssignmentsPerCell",
      "outcomeResponsiveStoppingPermitted",
    ],
    oneOf: [fixedSample, validSequential],
  };
};

const claim = () =>
  identifiedContract("claimId", {
    claimClass: {
      enum: [
        "upgrade-effect",
        "absolute-leverage",
        "variant-selection",
        "mechanism-attribution",
        "robustness",
        "efficiency",
        "downstream-utility",
      ],
    },
    estimandId: identifier(),
    treatmentArmId: identifier(),
    controlArmId: identifier(),
    contrastFunctionId: identifier(),
    analysisUnit: identifier(),
    targetPopulationId: identifier(),
    supportedConclusion: text(),
    decisionRuleDigest: digest(),
    precisionRuleDigest: digest(),
  });

const candidateSnapshot = () => {
  const adapterCapabilities = identifierArray({ minItems: 6 });
  const projectionSelector = {
    oneOf: [
      closed({
        kind: { const: "file" },
        path: {
          type: "string",
          pattern: "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[^\\\\\\u0000]+$",
        },
      }),
      closed({
        kind: { const: "tree" },
        path: {
          type: "string",
          pattern: "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[^\\\\\\u0000]+$",
        },
      }),
    ],
  };
  const adapter = closed({
    schemaVersion: { const: "1.0.0" },
    hashProfileId: {
      const: "survey-evaluator-sha256-jcs-v1",
    },
    adapterKind: { const: "survey-subject" },
    adapterId: identifier(),
    adapterInterfaceVersion: { const: "1.0.0" },
    subjectProtocolId: { const: "mission-kit/survey" },
    subjectProtocolVersion: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
    },
    skillIdentity: identifier(),
    runtimeSemanticsAuthority: { const: "supplied-host-binding" },
    nativeRuntimeSemanticsClaimed: { const: false },
    capabilities: adapterCapabilities,
    publicActionClasses: identifierArray({ minItems: 1 }),
    compiledProjectionSelectors: {
      type: "array",
      items: projectionSelector,
      minItems: 1,
      uniqueItems: true,
    },
    adapterDescriptorDigest: digest(),
  });
  const acquisitionProvenance = closed({
    acquisitionClass: { const: "explicit-local-directory" },
    captureAlgorithmId: { const: "stable-hostile-input-capture/v1" },
    sourceRootExplicitlySupplied: { const: true },
    repositoryDiscoveryPerformed: { const: false },
    archiveExpansionPerformed: { const: false },
    stablePassCount: { const: 3 },
    stablePassRoots: {
      type: "array",
      items: digest(),
      minItems: 3,
      maxItems: 3,
    },
    captureLimitsDigest: digest(),
    sourceMutationObserved: { const: false },
  });
  const snapshotLayout = closed({
    schemaVersion: { const: "1.0.0" },
    payloadDirectory: { const: "payload" },
    manifestFile: { const: "candidate-snapshot.json" },
    readOnly: { const: true },
  });
  return identifiedContract("candidateSnapshotId", {
    skillIdentity: identifier(),
    capabilities: adapterCapabilities,
    adapter,
    rootKind: { const: "complete_regular_file_inventory" },
    entries: { type: "array", items: inventoryEntry, minItems: 1 },
    candidatePackageRoot: digest(),
    foldDomain: { const: "candidate-package-fold/v1" },
    compiledProjectionRoots: digestArray({ minItems: 1 }),
    acquisitionProvenance,
    acquisitionEvidenceRoots: digestArray({ minItems: 1 }),
    snapshotLayout,
    implicitExclusionsPermitted: { const: false },
  });
};

const conflictAttestation = () =>
  identifiedContract("conflictAttestationId", {
    actorId: identifier(),
    roleId: identifier(),
    priorExposureClasses: identifierArray(),
    incompatibleRoleIds: identifierArray(),
    candidateIdentityVisible: { type: "boolean" },
    expectedDirectionVisible: { type: "boolean" },
    admission: {
      enum: ["admitted", "rejected_conflict", "rejected_prior_exposure"],
    },
    authorityAttestation: attestation(),
  });

const scenario = () =>
  identifiedContract("scenarioId", {
    workItem: text(),
    provenanceRoot: digest(),
    outcomeAxes: {
      type: "array",
      minItems: 1,
      items: closed({
        axisId: identifier(),
        publicLabel: text(),
      }),
    },
    scenarioClass: {
      enum: [
        "canonical",
        "ambiguous",
        "contradictory",
        "invalid_input",
        "withholding_correction",
        "interrupted_takeover",
        "adversarial_untrusted",
      ],
    },
    requiredCapabilities: identifierArray(),
    calibrationRefs: digestArray(),
    protectedMaterialIncluded: { const: false },
  });

const latentIntent = () =>
  identifiedContract("latentIntentId", {
    scenarioId: identifier(),
    goals: textArray({ minItems: 1 }),
    constraints: textArray(),
    priorities: {
      type: "array",
      items: closed({
        priorityId: identifier(),
        rank: positiveInteger(),
        statement: text(),
      }),
    },
    tensions: textArray(),
    uncertainties: textArray(),
    permissibleUnderdetermination: textArray(),
    provenanceRoots: digestArray({ minItems: 1 }),
    authorityAttestation: attestation(),
  });

const personaBrief = () =>
  identifiedContract("personaBriefId", {
    scenarioId: identifier(),
    latentIntentDigest: digest(),
    enactedBehaviorClass: {
      enum: [
        "terse",
        "expansive",
        "skeptical",
        "contradictory",
        "correction_prone",
      ],
    },
    permissibleKnowledge: textArray(),
    prohibitedDisclosure: textArray(),
    interactionBehaviors: identifierArray(),
    principalRef: identifier(),
    bearerCapabilityIncluded: { const: false },
  });

const semanticKey = () =>
  identifiedContract("semanticKeyId", {
    scenarioId: identifier(),
    latentIntentDigest: digest(),
    key: discriminated("purpose", {
      survey: {
        properties: {
          requiredMeaning: textArray({ minItems: 1 }),
          optionalMeaning: textArray(),
          prohibitedMeaning: textArray(),
          rubricDigest: digest(),
        },
      },
      downstream: {
        properties: {
          downstreamTaskDigest: digest(),
          requiredMeaning: textArray({ minItems: 1 }),
          optionalMeaning: textArray(),
          prohibitedMeaning: textArray(),
          rubricDigest: digest(),
        },
      },
    }),
    equivalenceClassesRoot: digest(),
    priorityRelationsRoot: digest(),
    tensions: textArray(),
    uncertainties: textArray(),
    exactAnswerScript: { const: false },
  });

const scenarioReview = () =>
  identifiedContract("scenarioReviewId", {
    scenarioDigest: digest(),
    personaBriefDigest: digest(),
    surveySemanticKeyDigest: digest(),
    downstreamParity: discriminated("applicability", {
      not_required: { properties: { claimRequiresDownstream: { const: false } } },
      required: {
        properties: {
          claimRequiresDownstream: { const: true },
          downstreamTaskDigest: digest(),
          downstreamSemanticKeyDigest: digest(),
        },
      },
    }),
    noScriptPassed: { type: "boolean" },
    feasibilityPassed: { type: "boolean" },
    privacyPassed: { type: "boolean" },
    conflictPassed: { type: "boolean" },
    calibrationFindingRefs: digestArray(),
    verdict: { enum: ["pass", "fail"] },
  });

const visibilityPolicy = () =>
  identifiedContract("visibilityPolicyId", {
    roleId: identifier(),
    readableObjectClasses: identifierArray(),
    writableObjectClasses: identifierArray(),
    allowedTools: identifierArray(),
    workspacePolicy: {
      enum: ["fresh_isolated", "read_only_snapshot", "sealed_protected"],
    },
    environmentVariables: identifierArray(),
    networkPolicy: { enum: ["disabled", "allowlist"] },
    networkAllowlist: textArray(),
    productionCredentials: { const: false },
  });

const assignment = () =>
  identifiedContract("assignmentId", {
    roleId: identifier(),
    armId: identifier(),
    scenarioId: identifier(),
    cellId: identifier(),
    assignmentClass: { enum: ["survey", "downstream"] },
    assignmentKind: { enum: ["primary", "reserve"] },
    initialState: identifier(),
    sourceUniverseRoot: digest(),
    sourceBindingRuleDigest: digest(),
    reserveBlockId: nullable(identifier()),
    subjectRandomizationEvidenceRoot: digest(),
    familyExecutionCommitmentRoot: digest(),
  });

const reviewerRegistrySnapshot = () =>
  identifiedContract("reviewerRegistrySnapshotId", {
    registryRevision: nonNegativeInteger(),
    capacityLedgerRoot: digest(),
    exposureLedgerRoot: digest(),
    eligibleReviewers: {
      type: "array",
      items: closed({
        opaqueReviewerId: identifier(),
        modelClass: identifier(),
        availableUnits: nonNegativeInteger(),
        qualificationRoot: digest(),
        conflictRoot: digest(),
        exposureRoot: digest(),
      }),
    },
    eligibilityRecipeDigest: digest(),
    exclusionRoots: digestArray(),
    stewardAttestation:
      reviewerRegistryStewardAttestation(),
    snapshotSeal: digest(),
    disclosureClass: { enum: ["protected_opaque", "bounded_aggregate"] },
  });

const reviewerRegistryRootAdmission = () =>
  identifiedContract("reviewerRegistryRootAdmissionId", {
    predecessorRegistryRoot: digest(),
    proposedRegistryRoot: digest(),
    policyRevision: positiveInteger(),
    schemaRevision: positiveInteger(),
    capacityLedgerRevision: nonNegativeInteger(),
    capacityLedgerRoot: digest(),
    prospectiveProofDigest: digest(),
    activeLeasePreservationProofDigest: digest(),
    stewardAttestation: attestation(),
    disposition: discriminated("status", {
      admitted: {
        properties: {
          admittedRegistryRoot: digest(),
          mutationApplied: { const: true },
        },
      },
      retroactive_root_rejected: {
        properties: {
          governedProtocolExtensionDefectRoot: digest(),
          mutationApplied: { const: false },
        },
      },
    }),
  });

const reviewerCapacityState = ({ lifecycleManifest }) =>
  stateContract({
    idField: "reviewerCapacityLedgerId",
    machineId: "reviewer-capacity-global",
    lifecycleManifest,
    properties: {
      admittedRegistryRoot: digest(),
      capacityExposureRoot: digest(),
      requestKeyIndexRoot: digest(),
      reservations: {
        type: "array",
        items: closed({
          capacityReservationId: identifier(),
          entryState: {
            enum: lifecycleStates(
              lifecycleManifest,
              "reviewer-capacity-entry",
            ),
          },
          requestRoot: digest(),
          exposureRoot: digest(),
        }),
      },
      registryAdmissionLedgerRoot: digest(),
      conflictTombstoneRoot: digest(),
      terminalDeliveryLedgerRoot: digest(),
      wholeLedgerQuarantineRef: nullable(digest()),
    },
  });

const allocationBeaconEvidence = () =>
  identifiedContract("allocationBeaconEvidenceId", {
    confirmatoryFamilyId: identifier(),
    sourceId: identifier(),
    scheduledRound: positiveInteger(),
    sourcePolicyDigest: digest(),
    signaturePolicyDigest: digest(),
    availabilityRuleDigest: digest(),
    signedOutput: text(),
    verification: discriminated("status", {
      verified: {
        properties: {
          verifiedOutputDigest: digest(),
          authorityReceipt: authorityReceiptRecord(),
        },
      },
      unavailable: {
        properties: {
          objectiveUnavailabilityEvidenceRoot: digest(),
        },
      },
      invalid: {
        properties: {
          failedVerificationRoot: digest(),
        },
      },
    }),
    familyEventRoot: digest(),
    familyBindingRoot: digest(),
    fallbackPermitted: { const: false },
    rerollPermitted: { const: false },
  });

const reviewReplacementBudget = () =>
  identifiedContract("reviewReplacementBudgetId", {
    confirmatoryFamilyId: identifier(),
    scope: { enum: ["per_slot", "shared"] },
    amount: nonNegativeInteger(),
    deadline: { type: "string", format: "date-time" },
    sharedPriorityOrder: identifierArray(),
    reservationRuleDigest: digest(),
    debitRuleDigest: digest(),
    objectiveObservationContractDigest: digest(),
    ledgerRoot: digest(),
    reservationLedgerRoot: digest(),
    refundPermitted: { const: false },
  });

const judgeAssignment = () =>
  identifiedContract("judgeAssignmentId", {
    confirmatoryFamilyId: identifier(),
    familyAllocationDigest: digest(),
    reviewerAllocationPlanDigest: digest(),
    stableSlotKey: identifier(),
    presentationRank: nonNegativeInteger(),
    blindBundleId: identifier(),
    opaqueReviewerId: identifier(),
    identityCursorRef: digest(),
    derivationEvidenceRoot: digest(),
    reviewerSelectionAuthority: { const: false },
    presentationOrderAuthority: { const: false },
  });

export const GOVERNANCE_SCHEMA_FACTORIES = Object.freeze({
  "e0-baseline-evidence.schema.json": e0BaselineEvidence,
  "authority-trust-root.schema.json": authorityTrustRoot,
  "authority-receipt.schema.json": authorityReceipt,
  "product-state.schema.json": productState,
  "scenario-state.schema.json": scenarioState,
  "scenario-bank-state.schema.json": scenarioBankState,
  "scenario-cohort-use.schema.json": scenarioCohortUse,
  "evaluation-decision-lineage-identity.schema.json":
    evaluationDecisionLineageIdentity,
  "evaluation-decision-lineage-state.schema.json":
    evaluationDecisionLineageState,
  "family-revision-authorization.schema.json": familyRevisionAuthorization,
  "family-authorization-disposition.schema.json":
    familyAuthorizationDisposition,
  "lineage-analysis.schema.json": lineageAnalysis,
  "lineage-handoff-index.schema.json": lineageHandoffIndex,
  "confirmatory-family-identity.schema.json": confirmatoryFamilyIdentity,
  "confirmatory-family-state.schema.json": confirmatoryFamilyState,
  "confirmatory-family-attachment.schema.json": confirmatoryFamilyAttachment,
  "family-execution-commitment.schema.json": familyExecutionCommitment,
  "family-campaign-disposition.schema.json": familyCampaignDisposition,
  "family-withdrawal-authorization.schema.json":
    familyWithdrawalAuthorization,
  "family-terminal-disposition.schema.json": familyTerminalDisposition,
  "family-attachment-terminal-delivery.schema.json":
    familyAttachmentTerminalDelivery,
  "assurance-state.schema.json": assuranceState,
  "gate-evidence.schema.json": gateEvidence,
  "assurance-issue-request.schema.json": assuranceIssueRequest,
  "issuer-trust-policy.schema.json": issuerTrustPolicy,
  "issuer-revocation.schema.json": issuerRevocation,
  "trust-state.schema.json": trustState,
  "assurance-operation-grant.schema.json": assuranceOperationGrant,
  "assurance-operation-receipt.schema.json": assuranceOperationReceipt,
  "assurance-invalidation-disposition.schema.json":
    assuranceInvalidationDisposition,
  "trust-admission-decision.schema.json": trustAdmissionDecision,
  "campaign.schema.json": campaign,
  "campaign-input.schema.json": campaignInput,
  "stopping-rule.schema.json": stoppingRule,
  "claim.schema.json": claim,
  "candidate-snapshot.schema.json": candidateSnapshot,
  "conflict-attestation.schema.json": conflictAttestation,
  "scenario.schema.json": scenario,
  "latent-intent.schema.json": latentIntent,
  "persona-brief.schema.json": personaBrief,
  "semantic-key.schema.json": semanticKey,
  "scenario-review.schema.json": scenarioReview,
  "visibility-policy.schema.json": visibilityPolicy,
  "assignment.schema.json": assignment,
  "reviewer-registry-snapshot.schema.json": reviewerRegistrySnapshot,
  "reviewer-registry-root-admission.schema.json":
    reviewerRegistryRootAdmission,
  "reviewer-capacity-state.schema.json": reviewerCapacityState,
  "allocation-beacon-evidence.schema.json": allocationBeaconEvidence,
  "review-replacement-budget.schema.json": reviewReplacementBudget,
  "judge-assignment.schema.json": judgeAssignment,
});
