import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  canonicalBytes,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  CampaignOrchestrator,
  FullSealedRoleCampaignDriver,
  createDeterministicFixtureRoleAdapters,
} from "../../source/executables/orchestrator/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function openRecoveredCampaign(fixture) {
  return CampaignOrchestrator.open({
    packageRoot,
    workspaceRoot: fixture.workspaceRoot,
    executionDriver: new FullSealedRoleCampaignDriver({
      fixtureAdapterFactories:
        createDeterministicFixtureRoleAdapters(),
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
}

test("cold recovery rejects a coherently self-sealed grant whose digest differs from durable EC20", async (t) => {
  const fixture = await makeFullRoleCampaignFixture({
    crashAfterTransitionId: "EC20",
  });
  t.after(fixture.cleanup);
  await assert.rejects(
    fixture.orchestrator.advance(),
    /Injected crash after durable sealed role transition/u,
  );

  const authorityPath = join(
    fixture.workspaceRoot,
    ".evaluator",
    "role-protocol",
    "awareness",
    "protected-unmask-authority.json",
  );
  const originalGrant = await readJson(authorityPath);
  const grantPath = join(
    fixture.workspaceRoot,
    ".evaluator",
    "role-protocol",
    "awareness",
    "unmask-grants",
    `${originalGrant.protectedUnmaskGrantId}.json`,
  );
  const substitutedGrant = structuredClone(originalGrant);
  substitutedGrant.analystScope.registeredDimensions = [
    ...substitutedGrant.analystScope.registeredDimensions,
    "substituted_dimension",
  ].sort();
  delete substitutedGrant.grantCoreDigest;
  substitutedGrant.grantCoreDigest = hashCanonical(
    "protected-unmask-grant/v1",
    substitutedGrant,
  );
  fixture.schemaValidator.assert(
    "protected-unmask-grant",
    substitutedGrant,
  );
  await writeFile(authorityPath, canonicalBytes(substitutedGrant));
  await writeFile(grantPath, canonicalBytes(substitutedGrant));

  const recovered = await openRecoveredCampaign(fixture);
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
    /Cold recovery transition replay conflicts with its durable command/u,
  );
  await assert.rejects(
    recovered.advance({ resume: true }),
    /Durable EC20 event does not bind the issued protected unmask grant/u,
  );

  await assert.rejects(
    access(
      join(
        fixture.workspaceRoot,
        ".evaluator",
        "role-protocol",
        "awareness",
        "unmask-grant-dispositions",
        `${originalGrant.protectedUnmaskGrantId}.json`,
      ),
    ),
  );
  await assert.rejects(
    access(
      join(
        fixture.workspaceRoot,
        "results",
        "campaign-failure-envelope.json",
      ),
    ),
  );
});
