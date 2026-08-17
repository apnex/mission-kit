import assert from "node:assert/strict";
import test from "node:test";
import {
  REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
  REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
  ReviewerAllocationAuthority,
  reviewerAllocationAuthorityInternals,
} from "../../source/executables/orchestrator/index.mjs";
import { hashCanonical } from "../../source/executables/engine/index.mjs";
import {
  makeReviewerAllocationAuthorityFixture,
} from "../helpers/reviewer-allocation-authority-fixture.mjs";
import {
  createExternalAuthorityFixture,
} from "../helpers/external-authority-fixture.mjs";

async function acquire(options = {}) {
  const fixture = await makeReviewerAllocationAuthorityFixture(options);
  const authority = new ReviewerAllocationAuthority({
    schemaValidator: fixture.schemaValidator,
    evidenceProvider: fixture.evidenceProvider,
    trustRoot: fixture.trustRoot,
    authorityRegistry: fixture.authorityRegistry,
  });
  const result = await authority.acquire({
    campaignId: fixture.campaignId,
    campaignSealDigest: fixture.campaignSealDigest,
    confirmatoryFamilyId: fixture.confirmatoryFamilyId,
    assignmentFamily: fixture.assignmentFamily,
  });
  return { result, fixture };
}

test("external reviewer allocation authority preserves pre-outcome external allocation invariants", async (t) => {
  await t.test("admits exactly two independent blinded reviewers per assignment", async () => {
    const { result, fixture } = await acquire();
    assert.equal(result.judgeAssignments.length, 4);
    for (const assignmentId of ["assignment.alpha", "assignment.beta"]) {
      const reviewers = result.judgeAssignments
        .filter((entry) => entry.judgeAssignmentId.startsWith(`${assignmentId}:`))
        .map((entry) => entry.opaqueReviewerId);
      assert.equal(new Set(reviewers).size, 2);
    }
    assert.equal(result.request.armMapDisclosed, false);
    assert.equal(result.request.outcomeInputsAvailable, false);
    assert.deepEqual(Object.keys(fixture.observedRequests[0]).sort(), [
      "allocationStage",
      "armMapDisclosed",
      "assignmentFamily",
      "assignmentFamilyDigest",
      "campaignId",
      "campaignSealDigest",
      "confirmatoryFamilyId",
      "hashProfileId",
      "outcomeInputsAvailable",
      "requestDigest",
      "reviewersPerAssignment",
      "schemaVersion",
    ]);
  });
  await t.test("rejects allocation evidence after outcome disclosure", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (evidence) => {
          evidence.binding.outcomeInputsUsed = true;
        },
      }),
      /pre-outcome evidence/u,
    );
  });
  await t.test("rejects self-selected reviewer evidence", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (evidence) => {
          evidence.binding.reviewerSelfSelection = true;
        },
      }),
      /pre-outcome evidence/u,
    );
  });
  await t.test("rejects duplicate reviewer allocation within one blind assignment", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (
          evidence,
          _request,
          { resealRegistrySnapshot },
        ) => {
          evidence.reviewerAllocationPlan.slots[1].primaryOpaqueIdentityId = "reviewer.one";
          evidence.registrySnapshot.eligibleReviewers[0].availableUnits = 2;
          resealRegistrySnapshot(evidence.registrySnapshot);
          const registryDigest = reviewerAllocationAuthorityInternals.hashRegistrySnapshot(
            evidence.registrySnapshot,
          );
          evidence.reviewerAllocationPlan.registrySnapshotDigest = registryDigest;
          evidence.reviewerAllocationPlan.stableSlotUniverseDigest = hashCanonical(
            "reviewer-allocation-slot-universe/v1",
            evidence.reviewerAllocationPlan.slots,
          );
          const identityUnits = reviewerAllocationAuthorityInternals.aggregateIdentityUnits(
            evidence.reviewerAllocationPlan.slots,
          );
          evidence.familyAllocationRecord.registrySnapshotDigest =
            registryDigest;
          evidence.familyAllocationRecord.stableSlotUniverseDigest =
            evidence.reviewerAllocationPlan.stableSlotUniverseDigest;
          evidence.familyAllocationRecord.reviewerAllocationPlan =
            structuredClone(evidence.reviewerAllocationPlan);
          evidence.capacityRequest.allocationRecordDigest =
            hashCanonical(
              "family-allocation-record/v1",
              evidence.familyAllocationRecord,
            );
          evidence.capacityRequest.registryRootDigest = registryDigest;
          evidence.capacityRequest.identityUnits = identityUnits;
          evidence.capacityDisposition.registryRootDigest = registryDigest;
          evidence.capacityDisposition.grantedIdentityUnits = identityUnits;
        },
      }),
      /independent externally allocated reviewers/u,
    );
  });
  await t.test("rejects a capacity or plan digest mismatch", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (evidence) => {
          evidence.capacityRequest.allocationRecordDigest = "a".repeat(64);
        },
      }),
      /capacity evidence/u,
    );
  });
  await t.test("rejects a self-asserted verified beacon after its signed output changes", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (evidence) => {
          evidence.allocationBeaconEvidence.signedOutput =
            "provider-rewritten-beacon-output";
          evidence.allocationBeaconEvidence.verification
            .verifiedOutputDigest = hashCanonical(
              "reviewer-allocation-beacon-output/v1",
              {
                signedOutput:
                  evidence.allocationBeaconEvidence
                    .signedOutput,
              },
            );
        },
      }),
      /command scope|signature verification/u,
    );
  });
  await t.test("rejects an otherwise valid beacon receipt under an unconfigured trust root", async () => {
    const fixture =
      await makeReviewerAllocationAuthorityFixture();
    const untrusted = createExternalAuthorityFixture({
      authorityIds: [
        REVIEWER_ALLOCATION_BEACON_AUTHORITY_ID,
        REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
      ],
      schemaValidator: fixture.schemaValidator,
      issuerId: "untrusted-reviewer-issuer",
      trustRootId: "untrusted-reviewer-root",
    });
    const authority = new ReviewerAllocationAuthority({
      schemaValidator: fixture.schemaValidator,
      evidenceProvider: fixture.evidenceProvider,
      trustRoot: untrusted.trustRoot,
      authorityRegistry: fixture.authorityRegistry,
    });
    await assert.rejects(
      authority.acquire({
        campaignId: fixture.campaignId,
        campaignSealDigest: fixture.campaignSealDigest,
        confirmatoryFamilyId:
          fixture.confirmatoryFamilyId,
        assignmentFamily: fixture.assignmentFamily,
      }),
      /configured trust root|not trusted/u,
    );
  });
  await t.test("rejects a trusted signer that asserts the wrong authority class", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (
          evidence,
          _request,
          { authority },
        ) => {
          const original =
            evidence.allocationBeaconEvidence
              .verification.authorityReceipt;
          const [wrongAuthorityReceipt] =
            authority.provider.issue({
              requiredAuthorityIds: [
                REVIEWER_REGISTRY_STEWARD_AUTHORITY_ID,
              ],
              commandScopeDigest:
                original.commandScopeDigest,
              participantPolicyId:
                "wrong-authority-fixture",
            });
          evidence.allocationBeaconEvidence
            .verification.authorityReceipt =
              wrongAuthorityReceipt;
        },
      }),
      /exactly satisfy participant policy/u,
    );
  });
  await t.test("rejects a coherently resealed registry snapshot without a new steward receipt", async () => {
    await assert.rejects(
      acquire({
        mutateEvidence: (evidence) => {
          evidence.registrySnapshot.eligibleReviewers[0]
            .modelClass = "provider-rewritten-model";
          const { snapshotSeal, ...unsealedRegistry } =
            evidence.registrySnapshot;
          evidence.registrySnapshot.snapshotSeal =
            reviewerAllocationAuthorityInternals
              .hashRegistrySeal(unsealedRegistry);
        },
      }),
      /steward attestation|command scope/u,
    );
  });
});
