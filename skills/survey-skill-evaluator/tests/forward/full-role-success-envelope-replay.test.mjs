import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  canonicalBytes,
  deepCloneCanonical,
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
      fixtureAdapterFactories: createDeterministicFixtureRoleAdapters(),
      subjectAdapterResolver: async () => fixture.subjectHost.adapter,
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

test("completed-campaign replay binds the exact frozen success envelope to every governance and evidence root", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  await fixture.orchestrator.advance();

  const envelopePath = join(
    fixture.workspaceRoot,
    "results",
    "campaign-evidence-envelope.json",
  );
  const scenarioRecord = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "protected",
      "scenario-material-authority.json",
    ),
  );
  const reviewerRecord = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "protected",
      "reviewer-allocation-authority.json",
    ),
  );
  const assignmentMap = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "protected",
      "assignment-map.json",
    ),
  );
  const seal = await readJson(
    join(fixture.workspaceRoot, ".evaluator", "campaign-seal.json"),
  );
  const mechanicalConformance = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "mechanical-conformance.json",
    ),
  );
  const stoppingExecutionPlan = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "protected",
      "stopping-execution-plan.json",
    ),
  );
  const controlAudit = await readJson(
    join(fixture.workspaceRoot, "results", "control-delta-audit.json"),
  );
  const originalEnvelope = await readJson(envelopePath);
  const requiredGovernanceRoots = [
    stoppingExecutionPlan.stoppingExecutionPlanDigest,
    scenarioRecord.authorityEnvelope.authorityEnvelopeDigest,
    reviewerRecord.allocation.reviewerAllocationPlanDigest,
    reviewerRecord.allocation.familyAllocationRecordDigest,
    reviewerRecord.allocation.registrySnapshotDigest,
    mechanicalConformance.mechanicalConformanceDigest,
    hashCanonical("control-delta-audit/v1", controlAudit),
  ];
  for (const root of requiredGovernanceRoots) {
    assert.equal(originalEnvelope.derivationRoots.includes(root), true);
  }
  const governanceRoots = [...originalEnvelope.derivationRoots].sort();

  const unchangedReplay = await openRecoveredCampaign(fixture);
  assert.equal(
    (await unchangedReplay.advance({ resume: true })).state,
    "EC18_CLOSED",
  );

  for (const [index, governanceRoot] of governanceRoots.entries()) {
    const driftRoot = hashCanonical("success-envelope-test-drift/v1", {
      index,
      governanceRoot,
    });
    const alteredGovernanceRoots = governanceRoots
      .map((root) => root === governanceRoot ? driftRoot : root)
      .sort();
    const altered = deepCloneCanonical(originalEnvelope);
    altered.derivationRoots = alteredGovernanceRoots;
    altered.evidenceRefs = altered.evidenceRefs
      .map((root) => root === governanceRoot ? driftRoot : root)
      .sort();
    altered.protectedSourceIndexRoot = hashCanonical(
      "protected-source-index/v1",
      {
        campaignId: originalEnvelope.campaignId,
        sealDigest: seal.sealDigest,
        assignmentMapDigest: assignmentMap.assignmentMapDigest,
        governanceEvidenceRoots: alteredGovernanceRoots,
      },
    );
    await writeFile(envelopePath, canonicalBytes(altered));
    try {
      const recovered = await openRecoveredCampaign(fixture);
      await assert.rejects(
        recovered.advance({ resume: true }),
        /conflicts with exact frozen campaign evidence/u,
        `accepted substituted governance root ${governanceRoot}`,
      );
    } finally {
      await writeFile(envelopePath, canonicalBytes(originalEnvelope));
    }
  }

  const evidenceRoot = originalEnvelope.evidenceRefs.find(
    (root) => !governanceRoots.includes(root),
  );
  assert.ok(evidenceRoot);
  const alteredEvidence = deepCloneCanonical(originalEnvelope);
  alteredEvidence.evidenceRefs = alteredEvidence.evidenceRefs.map(
    (root) =>
      root === evidenceRoot
        ? hashCanonical("success-envelope-evidence-drift/v1", {
            evidenceRoot,
          })
        : root,
  );
  await writeFile(envelopePath, canonicalBytes(alteredEvidence));
  const recovered = await openRecoveredCampaign(fixture);
  await assert.rejects(
    recovered.advance({ resume: true }),
    /conflicts with exact frozen campaign evidence/u,
  );
});
