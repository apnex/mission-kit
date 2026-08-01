import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  executionConfigurationPlanRoot,
} from "../../source/executables/orchestrator/index.mjs";
import {
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("every role execution is bound to one schema-valid preregistered execution configuration", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC18_CLOSED");

  const protectedRoot = join(
    fixture.workspaceRoot,
    ".evaluator",
    "protected",
  );
  const executionConfiguration = await readJson(
    join(protectedRoot, "execution-configuration.json"),
  );
  fixture.schemaValidator.assert(
    "execution-configuration",
    executionConfiguration,
  );
  assert.equal(
    JSON.stringify(executionConfiguration).includes("not_reported"),
    false,
  );
  assert.equal(
    JSON.stringify(executionConfiguration).includes("not-reported"),
    false,
  );

  const assignmentMap = await readJson(
    join(protectedRoot, "assignment-map.json"),
  );
  const scenarioRecord = await readJson(
    join(protectedRoot, "scenario-material-authority.json"),
  );
  const reviewerRecord = await readJson(
    join(protectedRoot, "reviewer-allocation-authority.json"),
  );
  const stoppingPlan = await readJson(
    join(protectedRoot, "stopping-execution-plan.json"),
  );
  const controlAudit = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "control-delta-audit.json",
    ),
  );
  const packageManifest = await readJson(
    join(packageRoot, "package.manifest.json"),
  );
  const generatedLock = await readJson(
    join(packageRoot, "generated.lock.json"),
  );
  assert.equal(
    executionConfiguration.assignmentMapDigest,
    assignmentMap.assignmentMapDigest,
  );
  assert.equal(
    executionConfiguration.stoppingExecutionPlanDigest,
    stoppingPlan.stoppingExecutionPlanDigest,
  );
  assert.equal(
    executionConfiguration.scenarioRoots.authorityEnvelopeDigest,
    scenarioRecord.authorityEnvelope.authorityEnvelopeDigest,
  );
  assert.equal(
    executionConfiguration.reviewerRoots
      .reviewerAllocationPlanDigest,
    reviewerRecord.allocation.reviewerAllocationPlanDigest,
  );
  assert.equal(
    executionConfiguration.reviewerRoots
      .familyAllocationRecordDigest,
    reviewerRecord.allocation.familyAllocationRecordDigest,
  );
  assert.equal(
    executionConfiguration.controlRoots.controlDeltaAuditDigest,
    hashCanonical("control-delta-audit/v1", controlAudit),
  );
  assert.equal(
    executionConfiguration.softwareRoots
      .evaluatorPackagePayloadRoot,
    packageManifest.payloadRoot,
  );
  assert.equal(
    executionConfiguration.softwareRoots.compilerSourceRoot,
    generatedLock.sourceRoot,
  );
  assert.equal(
    executionConfiguration.softwareRoots.compilerImplementationRoot,
    generatedLock.compilerRoot,
  );
  assert.equal(
    executionConfiguration.softwareRoots.generatedProjectionRoot,
    generatedLock.generatedTargetRoot,
  );
  assert.equal(executionConfiguration.rolePlans.length, 5);
  assert.equal(
    executionConfiguration.roleExecutionProfiles.length,
    5,
  );

  const workOrderRoot = join(
    fixture.workspaceRoot,
    "evidence",
    "work-orders",
  );
  const capsuleRoot = join(
    fixture.workspaceRoot,
    "evidence",
    "capsules",
  );
  const roleRoot = join(
    fixture.workspaceRoot,
    "evidence",
    "roles",
  );
  const workOrderFiles = (await readdir(workOrderRoot))
    .filter((name) => name.endsWith(".json"))
    .sort();
  assert.ok(workOrderFiles.length > 0);
  for (const filename of workOrderFiles) {
    const [workOrder, capsule, evidence] = await Promise.all([
      readJson(join(workOrderRoot, filename)),
      readJson(join(capsuleRoot, filename)),
      readJson(join(roleRoot, filename)),
    ]);
    assert.equal(
      workOrder.executionConfigurationDigest,
      executionConfiguration.executionConfigurationDigest,
      filename,
    );
    assert.equal(
      capsule.executionConfigurationDigest,
      executionConfiguration.executionConfigurationDigest,
      filename,
    );
    assert.equal(
      capsule.parentGrant.executionConfigurationDigest,
      executionConfiguration.executionConfigurationDigest,
      filename,
    );
    assert.equal(
      evidence.roleResult.hostIsolationAttestation
        .executionConfigurationDigest,
      executionConfiguration.executionConfigurationDigest,
      filename,
    );
  }

  const expectedPlanRoot = executionConfigurationPlanRoot(
    executionConfiguration.executionConfigurationDigest,
  );
  const state = await fixture.orchestrator.stateStore.load(
    "campaign",
    "campaign-fixture",
    { required: true },
  );
  for (const transitionId of ["EC01", "EC03a", "EC04", "EC05"]) {
    const event = state.authoritativeStateCore.eventLedger.find(
      (entry) => entry.core.transitionId === transitionId,
    );
    assert.ok(event, transitionId);
    assert.equal(
      event.core.inputDigest,
      hashCanonical("campaign-transition-input/v1", {
        executionClass: "sealed_role_campaign",
        sealDigest: executionConfiguration.campaignSealDigest,
        transitionId,
        evidenceRoot: expectedPlanRoot,
        provisionalOnly: true,
        promotionAuthorized: false,
      }),
      transitionId,
    );
  }
});
