import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { AuthorityReceiptVerifier } from "../engine/authority-receipts.mjs";
import { IntegrityError, ValidationError } from "../engine/errors.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";

const DIGEST = /^[a-f0-9]{64}$/u;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
export const REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID =
  "reviewer-allocation-beacon";
export const REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID =
  "reviewer-registry-steward";
const FORBIDDEN_DISCLOSURE_TERMS = new Set([
  "arm",
  "arms",
  "armmap",
  "treatment",
  "control",
  "outcome",
  "outcomes",
  "result",
  "results",
  "score",
  "scores",
  "ballot",
  "ballots",
]);

function exactKeys(value, expected, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new ValidationError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      actual,
      expected: required,
    });
  }
}

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} must be a portable identifier`, { value });
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    throw new ValidationError(`${label} must be a SHA-256 semantic digest`, { value });
  }
}

function lexical(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function canonicalAssignmentFamily(assignmentFamily) {
  if (!Array.isArray(assignmentFamily) || assignmentFamily.length === 0) {
    throw new ValidationError("Reviewer allocation requires a non-empty assignment family");
  }
  const seen = new Set();
  const normalized = assignmentFamily.map((entry) => {
    exactKeys(entry, ["assignmentId", "blindBundleId"], "Reviewer allocation assignment");
    assertIdentifier(entry.assignmentId, "Reviewer allocation assignment ID");
    assertIdentifier(entry.blindBundleId, "Reviewer allocation blind bundle ID");
    if (seen.has(entry.assignmentId)) {
      throw new ValidationError("Reviewer allocation assignment family repeats an assignment", {
        assignmentId: entry.assignmentId,
      });
    }
    seen.add(entry.assignmentId);
    return deepCloneCanonical(entry);
  });
  return normalized.sort((left, right) => lexical(left.assignmentId, right.assignmentId));
}

function containsForbiddenDisclosure(value, path = "$") {
  if (Array.isArray(value)) {
    return value.some((entry, index) => containsForbiddenDisclosure(entry, `${path}[${index}]`));
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value)) {
    const folded = key.replace(/[^a-z]/giu, "").toLowerCase();
    if (FORBIDDEN_DISCLOSURE_TERMS.has(folded)) return `${path}.${key}`;
    const nested = containsForbiddenDisclosure(child, `${path}.${key}`);
    if (nested) return nested;
  }
  return null;
}

function hashRegistrySnapshot(snapshot) {
  return hashCanonical("reviewer-registry-snapshot/v1", snapshot);
}

function hashRegistrySeal(snapshot) {
  const { snapshotSeal, ...unsealed } = snapshot;
  return hashCanonical("reviewer-registry-snapshot-seal/v1", unsealed);
}

function registryStewardAuthorityScope(snapshot) {
  const registryStatement = deepCloneCanonical(snapshot);
  delete registryStatement.stewardAttestation;
  delete registryStatement.snapshotSeal;
  const statementDigest = hashCanonical(
    "reviewer-registry-steward-statement/v1",
    registryStatement,
  );
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    authorityId:
      REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
    reviewerRegistrySnapshotId:
      snapshot.reviewerRegistrySnapshotId,
    statementDigest,
  };
  return {
    core,
    statementDigest,
    commandScopeDigest: hashCanonical(
      "reviewer-registry-steward-authority-scope/v1",
      core,
    ),
  };
}

function hashAssignmentFamily(assignments) {
  return hashCanonical("reviewer-allocation-assignment-family/v1", assignments);
}

function familyBinding({ campaignId, campaignSealDigest, confirmatoryFamilyId, assignmentFamilyDigest }) {
  return {
    campaignId,
    campaignSealDigest,
    confirmatoryFamilyId,
    assignmentFamilyDigest,
  };
}

function hashFamilyBinding(binding) {
  return hashCanonical("reviewer-allocation-family-binding/v1", binding);
}

function hashFamilyAllocation(binding) {
  return hashCanonical("reviewer-allocation-family/v1", binding);
}

function hashRequest(binding, assignmentFamily) {
  return hashCanonical("reviewer-allocation-request/v1", {
    ...binding,
    assignmentFamily,
    armMapDisclosed: false,
    outcomeInputsAvailable: false,
    allocationStage: "pre_outcome",
    reviewersPerAssignment: 2,
  });
}

function beaconAuthorityScope(beacon, expected) {
  const verifiedOutputDigest = hashCanonical(
    "reviewer-allocation-beacon-output/v1",
    { signedOutput: beacon.signedOutput },
  );
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    authorityId: REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
    campaignId: expected.campaignId,
    campaignSealDigest: expected.campaignSealDigest,
    confirmatoryFamilyId: expected.confirmatoryFamilyId,
    assignmentFamilyDigest: expected.assignmentFamilyDigest,
    requestDigest: expected.requestDigest,
    familyBindingRoot: beacon.familyBindingRoot,
    allocationBeaconEvidenceId: beacon.allocationBeaconEvidenceId,
    sourceId: beacon.sourceId,
    scheduledRound: beacon.scheduledRound,
    sourcePolicyDigest: beacon.sourcePolicyDigest,
    signaturePolicyDigest: beacon.signaturePolicyDigest,
    availabilityRuleDigest: beacon.availabilityRuleDigest,
    signedOutputDigest: verifiedOutputDigest,
    familyEventRoot: beacon.familyEventRoot,
    verificationStatus: "verified",
    fallbackPermitted: beacon.fallbackPermitted,
    rerollPermitted: beacon.rerollPermitted,
  };
  return {
    core,
    commandScopeDigest: hashCanonical(
      "reviewer-allocation-beacon-authority-scope/v1",
      core,
    ),
  };
}

function aggregateIdentityUnits(slots) {
  const units = new Map();
  for (const slot of slots) {
    units.set(slot.primaryOpaqueIdentityId, (units.get(slot.primaryOpaqueIdentityId) ?? 0) + 1);
  }
  return [...units.entries()]
    .map(([opaqueIdentityId, unitCount]) => ({ opaqueIdentityId, unitCount }))
    .sort((left, right) => lexical(left.opaqueIdentityId, right.opaqueIdentityId));
}

function equalCanonical(left, right) {
  return hashCanonical("reviewer-allocation-equality/v1", left) === hashCanonical("reviewer-allocation-equality/v1", right);
}

function assertRegisteredReviewerAuthorities(authorityRegistry) {
  if (
    authorityRegistry === null ||
    typeof authorityRegistry !== "object" ||
    Array.isArray(authorityRegistry) ||
    authorityRegistry.defaultPolicy !== "deny" ||
    !Array.isArray(authorityRegistry.authorities)
  ) {
    throw new ValidationError(
      "Reviewer allocation requires the package default-deny authority registry",
    );
  }
  const byId = new Map(
    authorityRegistry.authorities.map((authority) => [
      authority.authorityId,
      authority,
    ]),
  );
  const beacon = byId.get(
    REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
  );
  const steward = byId.get(
    REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
  );
  if (
    beacon?.kind !== "external-deterministic-service" ||
    !beacon.may?.includes(
      "attest-pre-outcome-family-beacon",
    ) ||
    ![
      "inspect-outcome",
      "choose-round",
      "reroll",
    ].every((constraint) =>
      beacon.mustNot?.includes(constraint)
    ) ||
    steward?.kind !== "external-judgment" ||
    !steward.may?.includes("attest-registry-root")
  ) {
    throw new ValidationError(
      "Reviewer allocation authorities are absent or under-constrained in the default-deny registry",
    );
  }
}

function assertExternalBinding(binding, expected) {
  exactKeys(
    binding,
    [
      "schemaVersion",
      "hashProfileId",
      "allocationAuthorityBindingId",
      "campaignId",
      "campaignSealDigest",
      "confirmatoryFamilyId",
      "assignmentFamilyDigest",
      "requestDigest",
      "allocationStage",
      "armMapDisclosed",
      "outcomeInputsUsed",
      "reviewerSelfSelection",
    ],
    "External reviewer allocation binding",
  );
  if (
    binding.schemaVersion !== "1.0.0" ||
    binding.hashProfileId !== HASH_PROFILE_ID ||
    binding.campaignId !== expected.campaignId ||
    binding.campaignSealDigest !== expected.campaignSealDigest ||
    binding.confirmatoryFamilyId !== expected.confirmatoryFamilyId ||
    binding.assignmentFamilyDigest !== expected.assignmentFamilyDigest ||
    binding.requestDigest !== expected.requestDigest ||
    binding.allocationStage !== "pre_outcome" ||
    binding.armMapDisclosed !== false ||
    binding.outcomeInputsUsed !== false ||
    binding.reviewerSelfSelection !== false
  ) {
    throw new IntegrityError("External reviewer allocation binding is not exact pre-outcome evidence", {
      expected,
      actual: binding,
    });
  }
  assertIdentifier(binding.allocationAuthorityBindingId, "Reviewer allocation authority binding ID");
}

function assertEvidenceEnvelope(evidence, expected, schemaValidator) {
  exactKeys(
    evidence,
    [
      "binding",
      "registrySnapshot",
      "allocationBeaconEvidence",
      "reviewerAllocationPlan",
      "familyAllocationRecord",
      "capacityRequest",
      "capacityDisposition",
    ],
    "External reviewer allocation evidence",
  );
  assertExternalBinding(evidence.binding, expected);
  schemaValidator.assert("reviewer-registry-snapshot", evidence.registrySnapshot);
  schemaValidator.assert("allocation-beacon-evidence", evidence.allocationBeaconEvidence);
  schemaValidator.assert("reviewer-allocation-plan", evidence.reviewerAllocationPlan);
  schemaValidator.assert("family-allocation-record", evidence.familyAllocationRecord);
  schemaValidator.assert("reviewer-capacity-request", evidence.capacityRequest);
  schemaValidator.assert("reviewer-capacity-disposition", evidence.capacityDisposition);
}

function assertEvidenceBindings(
  evidence,
  expected,
  authorityVerifier,
) {
  const registry = evidence.registrySnapshot;
  const beacon = evidence.allocationBeaconEvidence;
  const plan = evidence.reviewerAllocationPlan;
  const record = evidence.familyAllocationRecord;
  const capacityRequest = evidence.capacityRequest;
  const capacityDisposition = evidence.capacityDisposition;
  const binding = familyBinding(expected);
  const bindingRoot = hashFamilyBinding(binding);
  const familyAllocationDigest = hashFamilyAllocation(binding);
  const registryDigest = hashRegistrySnapshot(registry);
  const planDigest = hashCanonical("reviewer-allocation-plan/v1", plan);
  const beaconDigest = hashCanonical(
    "allocation-beacon-evidence/v1",
    beacon,
  );
  const recordDigest = hashCanonical(
    "family-allocation-record/v1",
    record,
  );

  if (registry.snapshotSeal !== hashRegistrySeal(registry)) {
    throw new IntegrityError("Reviewer registry snapshot seal does not bind its exact contents");
  }
  const registryScope =
    registryStewardAuthorityScope(registry);
  if (
    registry.stewardAttestation.authorityId !==
      REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID ||
    registry.stewardAttestation.statementDigest !==
      registryScope.statementDigest
  ) {
    throw new IntegrityError(
      "Reviewer registry steward attestation does not bind the exact snapshot",
    );
  }
  const registryStewardProof =
    authorityVerifier.verifyScope({
      requiredAuthorityIds: [
        REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
      ],
      commandScopeDigest:
        registryScope.commandScopeDigest,
      receipts: [
        registry.stewardAttestation
          .authorityReceipt,
      ],
    });
  const verifiedOutputDigest = hashCanonical(
    "reviewer-allocation-beacon-output/v1",
    { signedOutput: beacon.signedOutput },
  );
  if (
    beacon.confirmatoryFamilyId !== expected.confirmatoryFamilyId ||
    beacon.familyBindingRoot !== bindingRoot ||
    beacon.verification.status !== "verified" ||
    beacon.verification.verifiedOutputDigest !== verifiedOutputDigest ||
    beacon.fallbackPermitted !== false ||
    beacon.rerollPermitted !== false
  ) {
    throw new IntegrityError("Allocation beacon is not a verified exact family pre-allocation input");
  }
  const { commandScopeDigest } = beaconAuthorityScope(beacon, expected);
  const beaconAuthorityProof = authorityVerifier.verifyScope({
    requiredAuthorityIds: [
      REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
    ],
    commandScopeDigest,
    receipts: [beacon.verification.authorityReceipt],
  });
  if (
    plan.confirmatoryFamilyId !== expected.confirmatoryFamilyId ||
    plan.familyAllocationDigest !== familyAllocationDigest ||
    plan.registrySnapshotDigest !== registryDigest ||
    plan.outcomeInputsUsed !== false ||
    plan.armMapDisclosed !== false ||
    plan.stableSlotUniverseDigest !== hashCanonical("reviewer-allocation-slot-universe/v1", plan.slots)
  ) {
    throw new IntegrityError("Reviewer allocation plan is not bound to the exact blind family");
  }
  if (
    record.confirmatoryFamilyId !== expected.confirmatoryFamilyId ||
    record.registrySnapshotDigest !== registryDigest ||
    record.stableSlotUniverseDigest !==
      plan.stableSlotUniverseDigest ||
    record.allocationPolicyDigest !== plan.allocationPolicyDigest ||
    record.beaconEvidenceDigest !== beaconDigest ||
    record.predecessorAllocationDigest !== null ||
    record.provenance !== "fresh" ||
    record.rerollPermitted !== false ||
    !Number.isInteger(record.allocationOrdinal) ||
    record.allocationOrdinal < 0 ||
    !equalCanonical(record.reviewerAllocationPlan, plan)
  ) {
    throw new IntegrityError(
      "Family allocation record does not bind the exact pre-outcome reviewer plan and beacon",
    );
  }
  const forbiddenPath = containsForbiddenDisclosure({
    registrySnapshot: registry,
    allocationBeaconEvidence: beacon,
    reviewerAllocationPlan: plan,
    familyAllocationRecord: record,
    capacityRequest,
    capacityDisposition,
  });
  if (forbiddenPath) {
    throw new IntegrityError("Reviewer allocation evidence contains forbidden arm or outcome disclosure", {
      path: forbiddenPath,
    });
  }
  if (
    capacityRequest.confirmatoryFamilyId !== expected.confirmatoryFamilyId ||
    capacityRequest.registryRootDigest !== registryDigest ||
    capacityRequest.allocationRecordDigest !== recordDigest ||
    capacityRequest.containsSlotOrder !== false ||
    capacityRequest.containsArmMap !== false ||
    capacityRequest.containsOutcome !== false ||
    capacityDisposition.capacityRequestKey !== capacityRequest.capacityRequestKey ||
    capacityDisposition.capacityReservationId !== capacityRequest.capacityReservationId ||
    capacityDisposition.registryRootDigest !== registryDigest ||
    capacityDisposition.disposition !== "reserved_all_or_none" ||
    capacityDisposition.changedRequestPermitted !== false ||
    capacityDisposition.partialGrantPermitted !== false ||
    capacityDisposition.deniedIdentityUnits.length !== 0
  ) {
    throw new IntegrityError("Reviewer capacity evidence is not an all-or-none reservation for this allocation");
  }
  return {
    registryDigest,
    planDigest,
    beaconDigest,
    recordDigest,
    bindingRoot,
    familyAllocationDigest,
    allocationOrdinal: record.allocationOrdinal,
    registryStewardProof,
    beaconAuthorityProof,
  };
}

function assertSlotsAndCapacity(evidence, assignmentFamily) {
  const registryById = new Map(
    evidence.registrySnapshot.eligibleReviewers.map((reviewer) => [reviewer.opaqueReviewerId, reviewer]),
  );
  const assignments = new Map(assignmentFamily.map((assignment) => [assignment.assignmentId, assignment]));
  const slotsByAssignment = new Map(assignmentFamily.map((assignment) => [assignment.assignmentId, []]));
  const slotKeys = new Set();
  for (const slot of evidence.reviewerAllocationPlan.slots) {
    if (slotKeys.has(slot.stableSlotKey) || !assignments.has(slot.plannedObservationKey)) {
      throw new IntegrityError("Reviewer allocation has a duplicate slot or unknown blind observation", {
        stableSlotKey: slot.stableSlotKey,
        plannedObservationKey: slot.plannedObservationKey,
      });
    }
    slotKeys.add(slot.stableSlotKey);
    if (
      !slot.stableSlotKey.startsWith(`${slot.plannedObservationKey}:`) ||
      slot.orderedReplacementOpaqueIdentityIds.length !== 0 ||
      slot.conditionalTriggerId !== null ||
      !registryById.has(slot.primaryOpaqueIdentityId)
    ) {
      throw new IntegrityError("Reviewer slot has an ungoverned identity, replacement, or observation binding", {
        stableSlotKey: slot.stableSlotKey,
      });
    }
    slotsByAssignment.get(slot.plannedObservationKey).push(slot);
  }
  for (const [assignmentId, slots] of slotsByAssignment) {
    const identities = new Set(slots.map((slot) => slot.primaryOpaqueIdentityId));
    const ranks = slots.map((slot) => slot.presentationRank).sort((left, right) => left - right);
    if (slots.length !== 2 || identities.size !== 2 || !equalCanonical(ranks, [0, 1])) {
      throw new IntegrityError("Every blind assignment requires exactly two independent externally allocated reviewers", {
        assignmentId,
        slotCount: slots.length,
        reviewerCount: identities.size,
        presentationRanks: ranks,
      });
    }
  }
  const requestedUnits = aggregateIdentityUnits(evidence.reviewerAllocationPlan.slots);
  if (!equalCanonical(requestedUnits, evidence.capacityRequest.identityUnits) || !equalCanonical(requestedUnits, evidence.capacityDisposition.grantedIdentityUnits)) {
    throw new IntegrityError("Reviewer capacity reservation is not exact for the external allocation slots");
  }
  for (const unit of requestedUnits) {
    if (registryById.get(unit.opaqueIdentityId).availableUnits < unit.unitCount) {
      throw new IntegrityError("Reviewer allocation exceeds the independently snapshotted reviewer capacity", unit);
    }
  }
  return slotsByAssignment;
}

/**
 * Request and admit an externally determined, blinded reviewer allocation.
 * The provider receives only the explicit pre-outcome request: arms, candidate
 * labels, answers, ballots, scores, and downstream outcomes are deliberately
 * absent from both the request and admitted evidence shape.
 */
export class ReviewerAllocationAuthority {
  constructor({
    schemaValidator,
    evidenceProvider,
    trustRoot,
    authorityRegistry,
  }) {
    if (!schemaValidator || typeof schemaValidator.assert !== "function") {
      throw new ValidationError("Reviewer allocation authority requires a schema validator");
    }
    if (typeof evidenceProvider !== "function") {
      throw new ValidationError("Reviewer allocation authority requires an external evidence provider");
    }
    assertRegisteredReviewerAuthorities(authorityRegistry);
    this.schemaValidator = schemaValidator;
    this.evidenceProvider = evidenceProvider;
    this.authorityVerifier = new AuthorityReceiptVerifier({
      trustRoot,
      schemaValidator,
    });
  }

  async acquire({
    campaignId,
    campaignSealDigest,
    confirmatoryFamilyId,
    assignmentFamily,
    outcomeObserved = false,
    armMapDisclosed = false,
    outcomeInputsAvailable = false,
  }) {
    assertIdentifier(campaignId, "Campaign ID");
    assertDigest(campaignSealDigest, "Campaign seal digest");
    assertIdentifier(confirmatoryFamilyId, "Confirmatory family ID");
    if (outcomeObserved || armMapDisclosed || outcomeInputsAvailable) {
      throw new IntegrityError("Reviewer allocation must be requested before any arm or outcome disclosure");
    }
    const normalizedAssignments = canonicalAssignmentFamily(assignmentFamily);
    const assignmentFamilyDigest = hashAssignmentFamily(normalizedAssignments);
    const binding = familyBinding({ campaignId, campaignSealDigest, confirmatoryFamilyId, assignmentFamilyDigest });
    const requestDigest = hashRequest(binding, normalizedAssignments);
    const request = deepFreeze(deepCloneCanonical({
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      ...binding,
      assignmentFamily: normalizedAssignments,
      assignmentFamilyDigest,
      requestDigest,
      allocationStage: "pre_outcome",
      armMapDisclosed: false,
      outcomeInputsAvailable: false,
      reviewersPerAssignment: 2,
    }));
    const evidence = await this.evidenceProvider(request);
    return this.admitEvidence({ request, evidence });
  }

  admitEvidence({ request, evidence }) {
    exactKeys(
      request,
      [
        "schemaVersion",
        "hashProfileId",
        "campaignId",
        "campaignSealDigest",
        "confirmatoryFamilyId",
        "assignmentFamily",
        "assignmentFamilyDigest",
        "requestDigest",
        "allocationStage",
        "armMapDisclosed",
        "outcomeInputsAvailable",
        "reviewersPerAssignment",
      ],
      "Reviewer allocation request",
    );
    if (
      request.schemaVersion !== "1.0.0" ||
      request.hashProfileId !== HASH_PROFILE_ID ||
      request.allocationStage !== "pre_outcome" ||
      request.armMapDisclosed !== false ||
      request.outcomeInputsAvailable !== false ||
      request.reviewersPerAssignment !== 2
    ) {
      throw new IntegrityError(
        "Reviewer allocation request is not an exact pre-outcome request",
      );
    }
    assertIdentifier(request.campaignId, "Campaign ID");
    assertDigest(request.campaignSealDigest, "Campaign seal digest");
    assertIdentifier(
      request.confirmatoryFamilyId,
      "Confirmatory family ID",
    );
    const normalizedAssignments = canonicalAssignmentFamily(
      request.assignmentFamily,
    );
    const assignmentFamilyDigest = hashAssignmentFamily(
      normalizedAssignments,
    );
    const binding = familyBinding({
      campaignId: request.campaignId,
      campaignSealDigest: request.campaignSealDigest,
      confirmatoryFamilyId: request.confirmatoryFamilyId,
      assignmentFamilyDigest,
    });
    const requestDigest = hashRequest(binding, normalizedAssignments);
    if (
      request.assignmentFamilyDigest !== assignmentFamilyDigest ||
      request.requestDigest !== requestDigest ||
      !equalCanonical(
        request.assignmentFamily,
        normalizedAssignments,
      )
    ) {
      throw new IntegrityError(
        "Reviewer allocation request digest or assignment family changed",
      );
    }
    const expected = { ...binding, assignmentFamilyDigest, requestDigest };
    assertEvidenceEnvelope(evidence, expected, this.schemaValidator);
    const roots = assertEvidenceBindings(
      evidence,
      expected,
      this.authorityVerifier,
    );
    const slotsByAssignment = assertSlotsAndCapacity(evidence, normalizedAssignments);
    const judgeAssignments = [];
    for (const assignment of normalizedAssignments) {
      for (const slot of [...slotsByAssignment.get(assignment.assignmentId)].sort((left, right) => left.presentationRank - right.presentationRank)) {
        const judgeAssignment = {
          schemaVersion: "1.0.0",
          hashProfileId: HASH_PROFILE_ID,
          judgeAssignmentId: `${assignment.assignmentId}:${slot.presentationRank}`,
          confirmatoryFamilyId:
            request.confirmatoryFamilyId,
          familyAllocationDigest: roots.familyAllocationDigest,
          reviewerAllocationPlanDigest: roots.planDigest,
          stableSlotKey: slot.stableSlotKey,
          presentationRank: slot.presentationRank,
          blindBundleId: assignment.blindBundleId,
          opaqueReviewerId: slot.primaryOpaqueIdentityId,
          identityCursorRef: hashCanonical("reviewer-allocation-identity-cursor/v1", {
            reviewerAllocationPlanDigest: roots.planDigest,
            stableSlotKey: slot.stableSlotKey,
            opaqueReviewerId: slot.primaryOpaqueIdentityId,
          }),
          derivationEvidenceRoot: hashCanonical("reviewer-allocation-derivation/v1", {
            bindingRoot: roots.bindingRoot,
            registryDigest: roots.registryDigest,
            reviewerAllocationPlanDigest: roots.planDigest,
            stableSlotKey: slot.stableSlotKey,
          }),
          reviewerSelectionAuthority: false,
          presentationOrderAuthority: false,
        };
        this.schemaValidator.assert("judge-assignment", judgeAssignment);
        judgeAssignments.push(judgeAssignment);
      }
    }
    return deepFreeze(deepCloneCanonical({
      request,
      assignmentFamilyDigest,
      registrySnapshotDigest: roots.registryDigest,
      reviewerAllocationPlanDigest: roots.planDigest,
      familyAllocationRecordDigest: roots.recordDigest,
      familyAllocationOrdinal: roots.allocationOrdinal,
      familyBindingRoot: roots.bindingRoot,
      familyAllocationDigest: roots.familyAllocationDigest,
      registryStewardProof: roots.registryStewardProof,
      beaconAuthorityProof: roots.beaconAuthorityProof,
      evidence,
      judgeAssignments,
    }));
  }
}

export const reviewerAllocationAuthorityInternals = Object.freeze({
  hashRegistrySnapshot,
  hashRegistrySeal,
  hashAssignmentFamily,
  hashFamilyBinding,
  hashFamilyAllocation,
  hashRequest,
  registryStewardAuthorityScope,
  beaconAuthorityScope,
  aggregateIdentityUnits,
});
