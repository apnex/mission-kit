import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
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

test("cold recovery rejects a coherently re-self-sealed reviewer allocation with a tampered authority receipt before provider dispatch", async (t) => {
  const fixture = await makeFullRoleCampaignFixture({
    crashAfterTransitionId: "EC09",
  });
  t.after(fixture.cleanup);
  await assert.rejects(
    fixture.orchestrator.advance(),
    /Injected crash after durable sealed role transition/u,
  );

  const allocationPath = join(
    fixture.workspaceRoot,
    ".evaluator",
    "protected",
    "reviewer-allocation-authority.json",
  );
  const admittedRecord = await readJson(allocationPath);
  const receipt =
    admittedRecord.allocation.evidence.allocationBeaconEvidence
      .verification.authorityReceipt;
  receipt.signatureBase64url =
    `${receipt.signatureBase64url.startsWith("A") ? "B" : "A"}${receipt.signatureBase64url.slice(1)}`;
  delete admittedRecord.reviewerAllocationRecordDigest;
  admittedRecord.reviewerAllocationRecordDigest = hashCanonical(
    "admitted-reviewer-allocation-record/v1",
    admittedRecord,
  );
  await writeFile(allocationPath, canonicalBytes(admittedRecord));

  const providerInvocations = [];
  const poison = (providerClass) => async () => {
    providerInvocations.push(providerClass);
    throw new Error(`${providerClass} must not run during persisted allocation re-admission`);
  };
  const recovered = await CampaignOrchestrator.open({
    packageRoot,
    workspaceRoot: fixture.workspaceRoot,
    executionDriver: new FullSealedRoleCampaignDriver({
      fixtureAdapterFactories:
        createDeterministicFixtureRoleAdapters({
          onInvocation: poison("role-adapter"),
        }),
      subjectAdapterResolver: poison("subject-adapter-resolver"),
      directorActionProvider: poison("director-action-provider"),
      scenarioMaterialProvider: poison("scenario-material-provider"),
      reviewerAllocationProvider: poison("reviewer-allocation-provider"),
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
    /signature verification|configured trust root|command scope/u,
  );
  assert.deepEqual(providerInvocations, []);
});
