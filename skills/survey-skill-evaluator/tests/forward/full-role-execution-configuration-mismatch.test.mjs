import assert from "node:assert/strict";
import test from "node:test";
import {
  CampaignOrchestrator,
  FullSealedRoleCampaignDriver,
  createDeterministicFixtureExecutionProfiles,
  createDeterministicFixtureRoleAdapters,
} from "../../source/executables/orchestrator/index.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

test("cold recovery rejects a different coherently sealed execution profile before role redispatch", async (t) => {
  const fixture = await makeFullRoleCampaignFixture({
    crashAfterTransitionId: "EC09",
  });
  t.after(fixture.cleanup);
  await assert.rejects(
    fixture.orchestrator.advance(),
    /Injected crash after durable sealed role transition/u,
  );

  const redispatchedRoles = [];
  const recovered = await CampaignOrchestrator.open({
    packageRoot,
    workspaceRoot: fixture.workspaceRoot,
    executionDriver: new FullSealedRoleCampaignDriver({
      fixtureAdapterFactories:
        createDeterministicFixtureRoleAdapters({
          onInvocation: (entry) =>
            redispatchedRoles.push(entry.roleClass),
        }),
      roleExecutionProfiles:
        createDeterministicFixtureExecutionProfiles({
          providerVersion: "1.0.1",
        }),
      subjectAdapterResolver: async () =>
        fixture.subjectHost.adapter,
      directorActionProvider: async () => ({
        actionClass: "ratify",
        payload: { decision: "confirm" },
      }),
      scenarioMaterialProvider:
        fixture.scenarioAuthority.provider,
      reviewerAllocationProvider:
        fixture.reviewerAuthority.provider,
      reviewerAllocationTrustRoot:
        fixture.reviewerAuthority.trustRoot,
      clock: () => 1_700_000_000_000,
      authorityTrustRoot: fixture.authority.trustRoot,
      authorityReceiptProvider: fixture.authority.provider,
    }),
    authorityTrustRoot: fixture.authority.trustRoot,
    authorityReceiptProvider: fixture.authority.provider,
  });
  const validation = await recovered.validate();
  await assert.rejects(
    recovered.executionDriver._advance({
      mode: "resume",
      validation,
      registry: recovered.registry,
      schemaValidator: recovered.schemaValidator,
      stateStore: recovered.stateStore,
      packageRoot: recovered.packageRoot,
      workspaceRoot: recovered.workspaceRoot,
    }),
    /Persisted execution configuration conflicts with exact pre-execution inputs/u,
  );
  assert.deepEqual(redispatchedRoles, []);
});
