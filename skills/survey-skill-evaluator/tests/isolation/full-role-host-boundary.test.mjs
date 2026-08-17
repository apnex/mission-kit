import assert from "node:assert/strict";
import test from "node:test";
import {
  FullSealedRoleCampaignDriver,
  createDeterministicFixtureExecutionProfiles,
} from "../../source/executables/orchestrator/index.mjs";
import { HASH_PROFILE_ID } from "../../source/executables/engine/index.mjs";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";
import {
  createScenarioMaterialAuthorityFixture,
} from "../helpers/scenario-material-authority-fixture.mjs";
import {
  createDynamicReviewerAllocationAuthorityFixture,
} from "../helpers/reviewer-allocation-authority-fixture.mjs";

test("full role campaign fails closed when the provider omits its host isolation attestation", async (t) => {
  const isolationProvider = {
    executionProfiles:
      createDeterministicFixtureExecutionProfiles({
        executionBoundary: "attested_host_isolation",
      }),
    async invoke({ capsule }) {
      return {
        output: {
          schemaVersion: "1.0.0",
          hashProfileId: HASH_PROFILE_ID,
          roleOutputClass: "synthetic_director_session",
          workOrderId: capsule.workOrderId,
          status: "completed",
          sessionPlan: {
            prompt: "fixture",
            artifactContract: ["summary"],
          },
        },
        attestation: {},
      };
    },
  };
  const scenarioAuthority =
    createScenarioMaterialAuthorityFixture();
  const reviewerAuthority =
    createDynamicReviewerAllocationAuthorityFixture();
  const fixture = await makeCampaignFixture({
    executionDriver: new FullSealedRoleCampaignDriver({
      isolationProvider,
      subjectAdapterResolver: async () => {
        throw new Error("subject execution must not precede Director isolation");
      },
      directorActionProvider: async () => ({
        actionClass: "ratify",
        payload: { decision: "confirm" },
      }),
      scenarioMaterialProvider: scenarioAuthority.provider,
      reviewerAllocationProvider: reviewerAuthority.provider,
      reviewerAllocationTrustRoot: reviewerAuthority.trustRoot,
    }),
    assignmentsPerCell: 1,
  });
  t.after(fixture.cleanup);
  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC_FAILED_CLOSED");
  assert.equal(result.executionClass, "sealed_role_campaign_failure");
  assert.equal(result.failureCause, "authorization_error");
  assert.equal(result.promotionAuthorized, false);
});
