import assert from "node:assert/strict";
import test from "node:test";
import {
  CampaignOrchestrator,
  FullSealedRoleCampaignDriver,
  createDeterministicFixtureRoleAdapters,
} from "../../source/executables/orchestrator/index.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

test("cold resume reuses durable role evidence and does not redispatch completed roles", async (t) => {
  const fixture = await makeFullRoleCampaignFixture({
    crashAfterTransitionId: "EC09",
  });
  t.after(fixture.cleanup);
  await assert.rejects(
    fixture.orchestrator.advance(),
    /Injected crash after durable sealed role transition/u,
  );
  assert.deepEqual(
    fixture.invocations.map((entry) => entry.roleClass).sort(),
    [
      "survey-executor",
      "survey-executor",
      "synthetic-director",
      "synthetic-director",
    ],
  );

  const resumedInvocations = [];
  const recovered = await CampaignOrchestrator.open({
    packageRoot,
    workspaceRoot: fixture.workspaceRoot,
    executionDriver: new FullSealedRoleCampaignDriver({
      fixtureAdapterFactories: createDeterministicFixtureRoleAdapters({
        onInvocation: (entry) => resumedInvocations.push(entry.roleClass),
      }),
      subjectAdapterResolver: async () => fixture.subjectHost.adapter,
      directorActionProvider: async () => ({
        actionClass: "ratify",
        payload: { decision: "confirm" },
      }),
      scenarioMaterialProvider:
        fixture.scenarioAuthority.provider,
      reviewerAllocationProvider:
        async () => {
          throw new Error(
            "persisted reviewer allocation must be re-admitted without provider invocation",
          );
        },
      reviewerAllocationTrustRoot:
        fixture.reviewerAuthority.trustRoot,
      clock: () => 1_700_000_000_000,
      authorityTrustRoot: fixture.authority.trustRoot,
      authorityReceiptProvider: fixture.authority.provider,
    }),
    authorityTrustRoot: fixture.authority.trustRoot,
    authorityReceiptProvider: fixture.authority.provider,
  });
  const result = await recovered.advance({ resume: true });
  assert.equal(result.state, "EC18_CLOSED");
  assert.equal(resumedInvocations.includes("synthetic-director"), false);
  assert.equal(resumedInvocations.includes("survey-executor"), false);
  assert.equal(resumedInvocations.includes("downstream-consumer"), true);

  const state = await recovered.stateStore.load(
    "campaign",
    "campaign-fixture",
    { required: true },
  );
  const transitions = state.authoritativeStateCore.eventLedger.map(
    (event) => event.core.transitionId,
  );
  assert.equal(new Set(transitions).size, transitions.length);
});
