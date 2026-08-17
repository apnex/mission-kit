import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  HASH_PROFILE_ID,
  SchemaValidator,
  deepCloneCanonical,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
  REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
  reviewerAllocationAuthorityInternals,
} from "../../source/executables/orchestrator/index.mjs";
import {
  createExternalAuthorityFixture,
} from "./external-authority-fixture.mjs";

const root = () => hashCanonical("reviewer-allocation-fixture-root/v1", { value: "fixture" });

function sealAllocationBeacon({
  beaconCore,
  expected,
  authority,
}) {
  const verifiedOutputDigest = hashCanonical(
    "reviewer-allocation-beacon-output/v1",
    { signedOutput: beaconCore.signedOutput },
  );
  const { commandScopeDigest } =
    reviewerAllocationAuthorityInternals.beaconAuthorityScope(
      beaconCore,
      expected,
    );
  const [authorityReceipt] = authority.provider.issue({
    requiredAuthorityIds: [
      REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
    ],
    commandScopeDigest,
    participantPolicyId:
      "reviewer-allocation-beacon-policy",
  });
  return {
    ...beaconCore,
    verification: {
      status: "verified",
      verifiedOutputDigest,
      authorityReceipt,
    },
  };
}

function sealReviewerRegistry({
  registryCore,
  authority,
}) {
  const {
    statementDigest,
    commandScopeDigest,
  } =
    reviewerAllocationAuthorityInternals
      .registryStewardAuthorityScope(registryCore);
  const [authorityReceipt] = authority.provider.issue({
    requiredAuthorityIds: [
      REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
    ],
    commandScopeDigest,
    participantPolicyId:
      "reviewer-registry-steward-policy",
  });
  const registryWithoutSeal = {
    ...registryCore,
    stewardAttestation: {
      authorityId:
        REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
      statementDigest,
      authorityReceipt,
    },
  };
  return {
    ...registryWithoutSeal,
    snapshotSeal:
      reviewerAllocationAuthorityInternals
        .hashRegistrySeal(registryWithoutSeal),
  };
}

function resealReviewerRegistry(snapshot, authority) {
  const registryCore = deepCloneCanonical(snapshot);
  delete registryCore.stewardAttestation;
  delete registryCore.snapshotSeal;
  const sealed = sealReviewerRegistry({
    registryCore,
    authority,
  });
  for (const key of Object.keys(snapshot)) {
    delete snapshot[key];
  }
  Object.assign(snapshot, sealed);
}

export const REVIEWER_ALLOCATION_FAMILY = Object.freeze([
  { assignmentId: "assignment.alpha", blindBundleId: "bundle.alpha" },
  { assignmentId: "assignment.beta", blindBundleId: "bundle.beta" },
]);

export async function makeReviewerAllocationAuthorityFixture({ mutateEvidence = null } = {}) {
  const schemaValidator = await SchemaValidator.fromPackageRoot(process.cwd());
  const authorityRegistry = JSON.parse(
    await readFile(
      join(
        process.cwd(),
        "source/fragments/authority/authority-registry.json",
      ),
      "utf8",
    ),
  );
  const beaconAuthority = createExternalAuthorityFixture({
    authorityIds: [
      REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
      REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
    ],
    schemaValidator,
    issuerId: "reviewer-allocation-beacon-issuer.fixture",
    trustRootId:
      "reviewer-allocation-beacon-trust-root.fixture",
  });
  const campaignId = "campaign.fixture";
  const campaignSealDigest = hashCanonical("reviewer-allocation-fixture-campaign-seal/v1", { campaignId });
  const confirmatoryFamilyId = "family.fixture";
  const assignmentFamily = deepCloneCanonical(REVIEWER_ALLOCATION_FAMILY);
  const assignmentFamilyDigest = reviewerAllocationAuthorityInternals.hashAssignmentFamily(assignmentFamily);
  const binding = {
    campaignId,
    campaignSealDigest,
    confirmatoryFamilyId,
    assignmentFamilyDigest,
  };
  const requestDigest = reviewerAllocationAuthorityInternals.hashRequest(binding, assignmentFamily);
  const reviewers = ["reviewer.one", "reviewer.two", "reviewer.three", "reviewer.four"];
  const registrySnapshot = sealReviewerRegistry({
    registryCore: {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    reviewerRegistrySnapshotId: "registry.fixture",
    registryRevision: 1,
    capacityLedgerRoot: root(),
    exposureLedgerRoot: root(),
    eligibleReviewers: reviewers.map((opaqueReviewerId) => ({
      opaqueReviewerId,
      modelClass: "fixture-model",
      availableUnits: 1,
      qualificationRoot: root(),
      conflictRoot: root(),
      exposureRoot: root(),
    })),
    eligibilityRecipeDigest: root(),
    exclusionRoots: [],
    disclosureClass: "protected_opaque",
    },
    authority: beaconAuthority,
  });
  const registrySnapshotDigest = reviewerAllocationAuthorityInternals.hashRegistrySnapshot(registrySnapshot);
  const slots = [
    {
      stableSlotKey: "assignment.alpha:0",
      purpose: "semantic-review",
      plannedObservationKey: "assignment.alpha",
      primaryOpaqueIdentityId: "reviewer.one",
      orderedReplacementOpaqueIdentityIds: [],
      presentationRank: 0,
      conditionalTriggerId: null,
    },
    {
      stableSlotKey: "assignment.alpha:1",
      purpose: "semantic-review",
      plannedObservationKey: "assignment.alpha",
      primaryOpaqueIdentityId: "reviewer.two",
      orderedReplacementOpaqueIdentityIds: [],
      presentationRank: 1,
      conditionalTriggerId: null,
    },
    {
      stableSlotKey: "assignment.beta:0",
      purpose: "semantic-review",
      plannedObservationKey: "assignment.beta",
      primaryOpaqueIdentityId: "reviewer.three",
      orderedReplacementOpaqueIdentityIds: [],
      presentationRank: 0,
      conditionalTriggerId: null,
    },
    {
      stableSlotKey: "assignment.beta:1",
      purpose: "semantic-review",
      plannedObservationKey: "assignment.beta",
      primaryOpaqueIdentityId: "reviewer.four",
      orderedReplacementOpaqueIdentityIds: [],
      presentationRank: 1,
      conditionalTriggerId: null,
    },
  ];
  const reviewerAllocationPlan = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    reviewerAllocationPlanId: "allocation.fixture",
    confirmatoryFamilyId,
    familyAllocationDigest: reviewerAllocationAuthorityInternals.hashFamilyAllocation(binding),
    registrySnapshotDigest,
    stableSlotUniverseDigest: hashCanonical("reviewer-allocation-slot-universe/v1", slots),
    allocationPolicyDigest: root(),
    slots,
    balanceProofDigest: root(),
    overlapProofDigest: root(),
    replacementBudgetPolicyDigest: root(),
    outcomeInputsUsed: false,
    armMapDisclosed: false,
  };
  const reviewerAllocationPlanDigest = hashCanonical("reviewer-allocation-plan/v1", reviewerAllocationPlan);
  const identityUnits = reviewerAllocationAuthorityInternals.aggregateIdentityUnits(slots);
  const capacityRequest = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    capacityRequestKey: root(),
    capacityReservationId: "reservation.fixture",
    confirmatoryFamilyId,
    allocationRecordDigest: reviewerAllocationPlanDigest,
    cf05FenceDigest: root(),
    proposalDigest: root(),
    registryRootDigest: registrySnapshotDigest,
    identityUnits,
    containsSlotOrder: false,
    containsArmMap: false,
    containsOutcome: false,
  };
  const capacityDisposition = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    capacityRequestKey: capacityRequest.capacityRequestKey,
    capacityReservationId: capacityRequest.capacityReservationId,
    disposition: "reserved_all_or_none",
    registryRootDigest: registrySnapshotDigest,
    grantedIdentityUnits: identityUnits,
    deniedIdentityUnits: [],
    familyTerminalDigest: null,
    noFutureInvocationProofDigest: null,
    exposureRetained: true,
    changedRequestPermitted: false,
    partialGrantPermitted: false,
  };
  const signedOutput = "fixture-beacon-output";
  const allocationBeaconEvidence = sealAllocationBeacon({
    beaconCore: {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    allocationBeaconEvidenceId: "beacon.fixture",
    confirmatoryFamilyId,
    sourceId: "beacon.fixture",
    scheduledRound: 1,
    sourcePolicyDigest: root(),
    signaturePolicyDigest: root(),
    availabilityRuleDigest: root(),
    signedOutput,
    familyEventRoot: root(),
    familyBindingRoot: reviewerAllocationAuthorityInternals.hashFamilyBinding(binding),
    fallbackPermitted: false,
    rerollPermitted: false,
    },
    expected: {
      ...binding,
      requestDigest,
    },
    authority: beaconAuthority,
  });
  const familyAllocationRecord = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    familyAllocationRecordId: "family-allocation.fixture",
    confirmatoryFamilyId,
    decisionLineageId: "decision-lineage.fixture",
    allocationLineageId: "allocation-lineage.fixture",
    allocationOrdinal: 1,
    provenance: "fresh",
    registrySnapshotDigest,
    stableSlotUniverseDigest:
      reviewerAllocationPlan.stableSlotUniverseDigest,
    allocationPolicyDigest:
      reviewerAllocationPlan.allocationPolicyDigest,
    beaconEvidenceDigest: hashCanonical(
      "allocation-beacon-evidence/v1",
      allocationBeaconEvidence,
    ),
    predecessorAllocationDigest: null,
    subjectArmMappingDigest: hashCanonical(
      "reviewer-allocation-blind-subject-mapping/v1",
      { assignmentFamilyDigest },
    ),
    denominatorDigest: hashCanonical(
      "reviewer-allocation-denominator/v1",
      { assignmentFamilyDigest },
    ),
    reviewerAllocationPlan,
    rerollPermitted: false,
  };
  capacityRequest.allocationRecordDigest = hashCanonical(
    "family-allocation-record/v1",
    familyAllocationRecord,
  );
  const evidence = {
    binding: {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      allocationAuthorityBindingId: "allocation-binding.fixture",
      ...binding,
      requestDigest,
      allocationStage: "pre_outcome",
      armMapDisclosed: false,
      outcomeInputsUsed: false,
      reviewerSelfSelection: false,
    },
    registrySnapshot,
    allocationBeaconEvidence,
    reviewerAllocationPlan,
    familyAllocationRecord,
    capacityRequest,
    capacityDisposition,
  };
  const observedRequests = [];
  return {
    schemaValidator,
    campaignId,
    campaignSealDigest,
    confirmatoryFamilyId,
    assignmentFamily,
    authorityRegistry,
    trustRoot: beaconAuthority.trustRoot,
    beaconAuthority,
    observedRequests,
    evidenceProvider: async (request) => {
      observedRequests.push(deepCloneCanonical(request));
      if (request.requestDigest !== requestDigest) throw new Error("unexpected reviewer allocation request");
      const supplied = deepCloneCanonical(evidence);
      await mutateEvidence?.(supplied, request, {
        authority: beaconAuthority,
        resealRegistrySnapshot: (snapshot) =>
          resealReviewerRegistry(
            snapshot,
            beaconAuthority,
          ),
      });
      return supplied;
    },
  };
}

export function createDynamicReviewerAllocationAuthorityFixture({
  mutateEvidence = null,
} = {}) {
  const beaconAuthority = createExternalAuthorityFixture({
    authorityIds: [
      REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
      REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
    ],
    issuerId:
      "reviewer-allocation-beacon-issuer.dynamic-fixture",
    trustRootId:
      "reviewer-allocation-beacon-trust-root.dynamic-fixture",
  });
  const invocations = [];
  const provider = async (request) => {
    invocations.push(deepCloneCanonical(request));
    const binding = {
      campaignId: request.campaignId,
      campaignSealDigest: request.campaignSealDigest,
      confirmatoryFamilyId: request.confirmatoryFamilyId,
      assignmentFamilyDigest: request.assignmentFamilyDigest,
    };
    const reviewers = request.assignmentFamily.flatMap(
      (_assignment, assignmentIndex) =>
        [0, 1].map(
          (reviewerIndex) =>
            `reviewer.${assignmentIndex * 2 + reviewerIndex + 1}`,
        ),
    );
    const registrySnapshot = sealReviewerRegistry({
      registryCore: {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      reviewerRegistrySnapshotId: "registry.dynamic-fixture",
      registryRevision: 1,
      capacityLedgerRoot: root(),
      exposureLedgerRoot: root(),
      eligibleReviewers: reviewers.map((opaqueReviewerId) => ({
        opaqueReviewerId,
        modelClass: "fixture-model",
        availableUnits: 1,
        qualificationRoot: root(),
        conflictRoot: root(),
        exposureRoot: root(),
      })),
      eligibilityRecipeDigest: root(),
      exclusionRoots: [],
      disclosureClass: "protected_opaque",
      },
      authority: beaconAuthority,
    });
    const registrySnapshotDigest =
      reviewerAllocationAuthorityInternals.hashRegistrySnapshot(
        registrySnapshot,
      );
    const slots = request.assignmentFamily.flatMap(
      (assignment, assignmentIndex) =>
        [0, 1].map((presentationRank) => ({
          stableSlotKey:
            `${assignment.assignmentId}:${presentationRank}`,
          purpose: "semantic-review",
          plannedObservationKey: assignment.assignmentId,
          primaryOpaqueIdentityId:
            reviewers[assignmentIndex * 2 + presentationRank],
          orderedReplacementOpaqueIdentityIds: [],
          presentationRank,
          conditionalTriggerId: null,
        })),
    );
    const reviewerAllocationPlan = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      reviewerAllocationPlanId: "allocation.dynamic-fixture",
      confirmatoryFamilyId: request.confirmatoryFamilyId,
      familyAllocationDigest:
        reviewerAllocationAuthorityInternals.hashFamilyAllocation(
          binding,
        ),
      registrySnapshotDigest,
      stableSlotUniverseDigest: hashCanonical(
        "reviewer-allocation-slot-universe/v1",
        slots,
      ),
      allocationPolicyDigest: root(),
      slots,
      balanceProofDigest: root(),
      overlapProofDigest: root(),
      replacementBudgetPolicyDigest: root(),
      outcomeInputsUsed: false,
      armMapDisclosed: false,
    };
    const reviewerAllocationPlanDigest = hashCanonical(
      "reviewer-allocation-plan/v1",
      reviewerAllocationPlan,
    );
    const identityUnits =
      reviewerAllocationAuthorityInternals.aggregateIdentityUnits(slots);
    const capacityRequest = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      capacityRequestKey: root(),
      capacityReservationId: "reservation.dynamic-fixture",
      confirmatoryFamilyId: request.confirmatoryFamilyId,
      allocationRecordDigest: reviewerAllocationPlanDigest,
      cf05FenceDigest: root(),
      proposalDigest: root(),
      registryRootDigest: registrySnapshotDigest,
      identityUnits,
      containsSlotOrder: false,
      containsArmMap: false,
      containsOutcome: false,
    };
    const capacityDisposition = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      capacityRequestKey: capacityRequest.capacityRequestKey,
      capacityReservationId: capacityRequest.capacityReservationId,
      disposition: "reserved_all_or_none",
      registryRootDigest: registrySnapshotDigest,
      grantedIdentityUnits: identityUnits,
      deniedIdentityUnits: [],
      familyTerminalDigest: null,
      noFutureInvocationProofDigest: null,
      exposureRetained: true,
      changedRequestPermitted: false,
      partialGrantPermitted: false,
    };
    const signedOutput = "fixture-dynamic-beacon-output";
    const allocationBeaconEvidence = sealAllocationBeacon({
      beaconCore: {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      allocationBeaconEvidenceId: "beacon.dynamic-fixture",
      confirmatoryFamilyId: request.confirmatoryFamilyId,
      sourceId: "beacon.dynamic-fixture",
      scheduledRound: 1,
      sourcePolicyDigest: root(),
      signaturePolicyDigest: root(),
      availabilityRuleDigest: root(),
      signedOutput,
      familyEventRoot: root(),
      familyBindingRoot:
        reviewerAllocationAuthorityInternals.hashFamilyBinding(
          binding,
        ),
      fallbackPermitted: false,
      rerollPermitted: false,
      },
      expected: {
        ...binding,
        requestDigest: request.requestDigest,
      },
      authority: beaconAuthority,
    });
    const familyAllocationRecord = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      familyAllocationRecordId:
        "family-allocation.dynamic-fixture",
      confirmatoryFamilyId: request.confirmatoryFamilyId,
      decisionLineageId: "decision-lineage.dynamic-fixture",
      allocationLineageId:
        "allocation-lineage.dynamic-fixture",
      allocationOrdinal: 1,
      provenance: "fresh",
      registrySnapshotDigest,
      stableSlotUniverseDigest:
        reviewerAllocationPlan.stableSlotUniverseDigest,
      allocationPolicyDigest:
        reviewerAllocationPlan.allocationPolicyDigest,
      beaconEvidenceDigest: hashCanonical(
        "allocation-beacon-evidence/v1",
        allocationBeaconEvidence,
      ),
      predecessorAllocationDigest: null,
      subjectArmMappingDigest: hashCanonical(
        "reviewer-allocation-blind-subject-mapping/v1",
        {
          assignmentFamilyDigest:
            request.assignmentFamilyDigest,
        },
      ),
      denominatorDigest: hashCanonical(
        "reviewer-allocation-denominator/v1",
        {
          assignmentFamilyDigest:
            request.assignmentFamilyDigest,
        },
      ),
      reviewerAllocationPlan,
      rerollPermitted: false,
    };
    capacityRequest.allocationRecordDigest = hashCanonical(
      "family-allocation-record/v1",
      familyAllocationRecord,
    );
    const evidence = {
      binding: {
        schemaVersion: "1.0.0",
        hashProfileId: HASH_PROFILE_ID,
        allocationAuthorityBindingId:
          "allocation-binding.dynamic-fixture",
        ...binding,
        requestDigest: request.requestDigest,
        allocationStage: "pre_outcome",
        armMapDisclosed: false,
        outcomeInputsUsed: false,
        reviewerSelfSelection: false,
      },
      registrySnapshot,
      allocationBeaconEvidence,
      reviewerAllocationPlan,
      familyAllocationRecord,
      capacityRequest,
      capacityDisposition,
    };
    await mutateEvidence?.(evidence, request, {
      authority: beaconAuthority,
      resealRegistrySnapshot: (snapshot) =>
        resealReviewerRegistry(snapshot, beaconAuthority),
    });
    return deepCloneCanonical(evidence);
  };
  return {
    provider,
    invocations,
    trustRoot: beaconAuthority.trustRoot,
    beaconAuthority,
  };
}
