import assert from "node:assert/strict";
import test from "node:test";
import {
  HASH_PROFILE_ID,
  IntegrityError,
  SchemaValidator,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  buildCampaignFailureEnvelope,
} from "../../source/executables/orchestrator/campaign-failure-envelope.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

const digest = (label) =>
  hashCanonical("campaign-failure-envelope-test/v1", { label });

function fixture(overrides = {}) {
  const expectedPositions = [
    { positionId: "assignment-1", positionClass: "assignment" },
    { positionId: "assignment-2", positionClass: "assignment" },
    { positionId: "review-1", positionClass: "review" },
    { positionId: "reserve-1", positionClass: "reserve" },
  ];
  return {
    campaignId: "campaign-failure-test",
    sourcePhase: "EC9_JUDGING",
    failureCause: "irrecoverable_role_failure",
    failureEvidence: {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      failureClass: "fixture_failure",
      sourceEvidenceRoot: digest("source-evidence"),
    },
    readableSourceRoots: [digest("campaign"), digest("assignment-map")],
    unavailableSourceClasses: ["failed_role_output"],
    failurePreparationRoot: digest("failure-preparation"),
    expectedPositions,
    positionDispositions: expectedPositions.map((position, index) => ({
      ...position,
      disposition:
        index === 0
          ? "terminal"
          : index === 3
            ? "retired"
            : "terminalized_unconsumed",
      receiptRoot: digest(`position-${index}`),
    })),
    populationViews: [
      {
        populationClass: "all_assigned",
        assignmentCount: 2,
        observedCount: 1,
        missingCount: 1,
        failureCount: 1,
        contaminationCount: 0,
        denominatorDigest: digest("all-assigned-population"),
      },
      {
        populationClass: "instrument_valid",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
        contaminationCount: 0,
        denominatorDigest: digest("instrument-valid-population"),
      },
      {
        populationClass: "release_eligible",
        assignmentCount: 2,
        observedCount: 0,
        missingCount: 2,
        failureCount: 1,
        contaminationCount: 0,
        denominatorDigest: digest("release-eligible-population"),
      },
    ],
    stagePopulationViews: [
      ...["survey", "downstream"].flatMap((stage) => [
        {
          stage,
          populationClass: "all_assigned",
          assignmentCount: 2,
          observedCount: stage === "survey" ? 1 : 0,
          missingCount: stage === "survey" ? 1 : 2,
          failureCount: 1,
          contaminationCount: 0,
          denominatorDigest: digest(`${stage}-all-assigned-population`),
        },
        {
          stage,
          populationClass: "instrument_valid",
          assignmentCount: 2,
          observedCount: 0,
          missingCount: 2,
          failureCount: 1,
          contaminationCount: 0,
          denominatorDigest: digest(
            `${stage}-instrument-valid-population`,
          ),
        },
        {
          stage,
          populationClass: "release_eligible",
          assignmentCount: 2,
          observedCount: 0,
          missingCount: 2,
          failureCount: 1,
          contaminationCount: 0,
          denominatorDigest: digest(
            `${stage}-release-eligible-population`,
          ),
        },
      ]),
    ],
    awarenessClosures: [
      {
        obligationId: "awareness-1",
        state: "AW4_CLOSED",
        awarenessStateRoot: digest("awareness-state"),
        parentReceiptRoot: digest("awareness-parent"),
      },
    ],
    grantDispositions: [
      {
        grantId: "review-grant-1",
        disposition: "terminalized_unconsumed",
        receiptRoot: digest("grant"),
      },
    ],
    missingnessPolicyRoot: digest("missingness-policy"),
    unsupportedClaimIds: ["E6", "E7", "promotion"],
    ...overrides,
  };
}

test("campaign failure envelope totality", async (t) => {
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);

  await t.test(
    "reconciles every realized position, AW4 obligation, and grant receipt",
    () => {
      const result = buildCampaignFailureEnvelope({
        ...fixture(),
        schemaValidator,
      });
      assert.equal(result.envelope.admissible, false);
      assert.equal(result.envelope.positionDispositions.length, 4);
      assert.equal(result.envelope.populationViews.length, 3);
      assert.equal(result.envelope.stagePopulationViews.length, 6);
      assert.equal(
        result.envelope.populationViews[0].populationClass,
        "all_assigned",
      );
      assert.deepEqual(
        result.envelope.stagePopulationViews.map(
          ({ stage, populationClass }) =>
            `${stage}:${populationClass}`,
        ),
        [
          "survey:all_assigned",
          "survey:instrument_valid",
          "survey:release_eligible",
          "downstream:all_assigned",
          "downstream:instrument_valid",
          "downstream:release_eligible",
        ],
      );
      assert.equal(
        result.envelope.issuedOrRetirementPendingGrantsRemaining,
        false,
      );
      assert.equal(result.envelope.hashProfileId, HASH_PROFILE_ID);
      assert.equal(result.envelopeDigest.length, 64);
    },
  );

  await t.test("rejects an omitted assigned position", () => {
    const input = fixture();
    input.positionDispositions.pop();
    assert.throws(
      () => buildCampaignFailureEnvelope({ ...input, schemaValidator }),
      IntegrityError,
    );
  });

  await t.test("rejects non-AW4 obligations and live grants", () => {
    assert.throws(
      () =>
        buildCampaignFailureEnvelope({
          ...fixture({
            awarenessClosures: [
              {
                obligationId: "awareness-1",
                state: "AW2_REQUESTED",
                awarenessStateRoot: digest("awareness-state"),
                parentReceiptRoot: digest("awareness-parent"),
              },
            ],
          }),
          schemaValidator,
        }),
      IntegrityError,
    );
    assert.throws(
      () =>
        buildCampaignFailureEnvelope({
          ...fixture({
            grantDispositions: [
              {
                grantId: "review-grant-1",
                disposition: "issued",
                receiptRoot: digest("grant"),
              },
            ],
          }),
          schemaValidator,
        }),
      IntegrityError,
    );
  });
});
