import {
  attestation,
  closed,
  digest,
  digestArray,
  discriminated,
  identifier,
  identifiedContract,
  identifierArray,
  lifecycleStates,
  nonNegativeInteger,
  nullable,
  positiveInteger,
  text,
} from "./primitives.mjs";

const governedRemediationChain = closed({
  defectRoot: digest(),
  postMortemRoot: digest(),
  proposalDesignRoot: digest(),
  requirementIds: identifierArray({ minItems: 1 }),
  invariantIds: identifierArray({ minItems: 1 }),
  enforcedTestIds: identifierArray({ minItems: 1 }),
  remediationWorkRoot: digest(),
});

const learningHandoff = () =>
  identifiedContract("learningHandoffId", {
    learningRecordId: identifier(),
    learningDispositionRoot: digest(),
    decisionCutoffRoot: digest(),
    handoff: discriminated("handoffClass", {
      diagnosed_remediation: {
        properties: {
          remediationChain: governedRemediationChain,
          diagnosticDebateRoot: digest(),
          contributionRoots: digestArray(),
          dissentRoots: digestArray(),
        },
      },
      diagnosis_unavailable_capacity_request: {
        properties: {
          diagnosticCapacityRequestRoot: digest(),
          unavailabilityEvidenceRoot: digest(),
        },
      },
      capital_recovery: {
        properties: {
          remediationChain: governedRemediationChain,
          lr03SourceRequestRoot: digest(),
          learningCapitalTarget: { const: "LC01" },
          recovery: discriminated("recoveryClass", {
            terminalized_unconsumed: {
              properties: { terminalReceiptRoot: digest() },
            },
            readable_lcr_source_unverifiable: {
              properties: {
                lcrStateRoot: digest(),
                sourceDispositionRoot: digest(),
              },
            },
            request_quarantine_source_unverifiable: {
              properties: {
                observedLcrBytesRoot: digest(),
                requestQuarantineRoot: digest(),
              },
            },
            lc03_conflict: {
              properties: {
                conceptEntryRoot: digest(),
                conflictDispositionRoot: digest(),
              },
            },
          }),
        },
      },
    }),
    singleApprovalAdmissionContractDigest: digest(),
    releaseAuthority: { const: false },
    promotionAuthority: { const: false },
  });

const learningDecisionProposal = () =>
  identifiedContract("learningDecisionProposalId", {
    learningHandoffDigest: digest(),
    expectedLearningRevision: nonNegativeInteger(),
    decisionCutoffRoot: digest(),
    proposal: discriminated("decisionClass", {
      accept: {
        properties: {
          acceptedGovernedIdentityDigest: digest(),
          executionScopeDigest: digest(),
        },
      },
      reject: {
        properties: {
          rejectionReason: text(),
        },
      },
      defer: {
        properties: {
          deferralReason: text(),
          reconsiderationConditionDigest: digest(),
        },
      },
    }),
    prospectiveGovernedIdentityDigest: digest(),
    proposalDigest: digest(),
    externalLearningAuthorityAttestation: attestation(),
    authoritativeBeforeLr06: { const: false },
    reservesNamespaceBeforeLr06: { const: false },
    createsExternalBacklogBeforeLr06: { const: false },
    releaseAuthority: { const: false },
  });

const learningDecisionDisposition = () =>
  identifiedContract("learningDecisionDispositionId", {
    learningRecordId: identifier(),
    learningHandoffDigest: digest(),
    decisionCutoffRoot: digest(),
    preTransitionLr3Root: digest(),
    disposition: discriminated("dispositionClass", {
      proposal_committed: {
        properties: {
          learningDecisionProposalDigest: digest(),
          proposalClass: { const: "accept" },
          governedChainAdmissionRoot: digest(),
          externalApprovalIsSoleAuthority: { const: true },
        },
      },
      source_advanced_handoff_closed_unreceipted: {
        properties: {
          terminalLearningRoot: digest(),
          alreadyStagedProposalDigest: nullable(digest()),
          laterProposalReceivesSameDisposition: { const: true },
        },
      },
    }),
    suppliesCurrentEventOrSemanticRoot: { const: false },
    mutatesProposal: { const: false },
    reopensLearningRecord: { const: false },
    releaseAuthority: { const: false },
    promotionAuthority: { const: false },
  });

const handoffIndex = () =>
  identifiedContract("handoffIndexId", {
    campaignId: identifier(),
    decisionLineageId: identifier(),
    confirmatoryFamilyId: identifier(),
    familyOrdinal: positiveInteger(),
    preEc38CampaignStateRoot: digest(),
    campaignEvidenceEnvelopeDigest: digest(),
    protectedUnmaskGrantDigest: digest(),
    analysisResultDigest: digest(),
    recommendationDigest: digest(),
    campaignLineageDisclosureDigest: digest(),
    containsFutureFamilyTerminal: { const: false },
    containsLineageAnalysis: { const: false },
  });

const lineageIntakeDisposition = () =>
  identifiedContract("lineageIntakeDispositionId", {
    decisionLineageId: identifier(),
    campaignId: identifier(),
    confirmatoryFamilyId: identifier(),
    authorizationId: identifier(),
    handoffIndexDigest: digest(),
    intakeRequestDigest: digest(),
    cf07SoleConsumerRoot: digest(),
    cf08AcknowledgementRoot: digest(),
    preTransitionEdlRevision: nonNegativeInteger(),
    preTransitionEdlRoot: digest(),
    disposition: discriminated("dispositionClass", {
      accepted: {
        properties: {
          ec23AcknowledgementRoot: digest(),
        },
      },
      rejected: {
        properties: {
          rejectionReason: {
            enum: [
              "authorization_mismatch",
              "family_mismatch",
              "incomplete_handoff",
              "source_not_terminal",
            ],
          },
          conclusiveEvidenceRoot: digest(),
        },
      },
      source_terminal_family_quarantine: {
        properties: {
          priorEdl05FamilyQuarantineRoot: digest(),
          noFutureWorkEvidenceRoot: digest(),
        },
      },
      source_terminal_campaign_quarantine: {
        properties: {
          priorEdl05CampaignQuarantineRoot: digest(),
          campaignTerminalizationRoot: digest(),
          noFutureWorkEvidenceRoot: digest(),
        },
      },
    }),
    suppliesCurrentEventOrSemanticRoot: { const: false },
    carryingOutboxAuthority: { const: false },
    handoffMutationAuthority: { const: false },
    releaseAuthority: { const: false },
  });

const lineageIntakeDelivery = ({ lifecycleManifest }) =>
  identifiedContract("lineageIntakeDeliveryId", {
    decisionLineageId: identifier(),
    campaignId: identifier(),
    lineageIntakeDispositionDigest: digest(),
    outboxMessageDigest: digest(),
    correlationId: identifier(),
    campaignStateRoot: digest(),
    delivery: discriminated("deliveryClass", {
      consumed_accepted_ec23: {
        properties: {
          ec23ReceiptRoot: digest(),
        },
      },
      consumed_rejected_ecf04p: {
        properties: {
          ecf04pReceiptRoot: digest(),
        },
      },
      acknowledged_source_terminal: {
        properties: {
          sourceTerminalReceiptRoot: digest(),
        },
      },
      source_advanced_campaign_quarantined: {
        properties: {
          campaignQuarantineRoot: digest(),
          noFutureInvocationRoot: digest(),
          mutationApplied: { const: false },
        },
      },
      conflicting_attempt_rejected: {
        properties: {
          authoritativeOriginalEntryRoot: digest(),
          currentLineageRoot: digest(),
          currentLineageState: {
            enum: lifecycleStates(
              lifecycleManifest,
              "evaluation-decision-lineage",
            ).filter((state) => /^EDL[12]_/u.test(state)),
          },
          deliveryAttemptAuditRoot: digest(),
          originalDeliveryBlocked: { const: false },
        },
      },
    }),
    replayIdentityDigest: digest(),
    releaseAuthority: { const: false },
    familyMutationAuthority: { const: false },
    handoffRepairAuthority: { const: false },
  });

export const HANDOFF_SCHEMA_FACTORIES = Object.freeze({
  "learning-handoff.schema.json": learningHandoff,
  "learning-decision-proposal.schema.json": learningDecisionProposal,
  "learning-decision-disposition.schema.json": learningDecisionDisposition,
  "handoff-index.schema.json": handoffIndex,
  "lineage-intake-disposition.schema.json": lineageIntakeDisposition,
  "lineage-intake-delivery.schema.json": lineageIntakeDelivery,
});
