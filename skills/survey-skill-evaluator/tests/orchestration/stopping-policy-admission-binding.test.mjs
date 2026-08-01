import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hashCanonical } from "../../source/executables/engine/index.mjs";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

function reseal(record) {
  const core = Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== "sealDigest"),
  );
  return {
    ...core,
    sealDigest: hashCanonical("campaign-input-seal/v1", core),
  };
}

test("stopping policy is schema-admitted, semantically constrained, and independently replay-bound", async (t) => {
  const fixture = await makeCampaignFixture({ seal: false });
  t.after(fixture.cleanup);
  const stoppingPath = join(fixture.workspaceRoot, "stopping-rule.json");
  const sealPath = join(
    fixture.workspaceRoot,
    ".evaluator",
    "campaign-seal.json",
  );
  const originalStopping = await readJson(stoppingPath);

  await writeJson(stoppingPath, {
    ...originalStopping,
    unregisteredOutcomePeek: true,
  });
  await assert.rejects(
    fixture.orchestrator.seal(),
    /generated schema/u,
  );

  await writeJson(stoppingPath, {
    ...originalStopping,
    maximumAssignmentsPerCell: 1,
  });
  await assert.rejects(
    fixture.orchestrator.seal(),
    /exact assignment count/u,
  );

  await writeJson(stoppingPath, originalStopping);
  await fixture.orchestrator.seal();
  const originalSeal = await readJson(sealPath);
  assert.deepEqual(originalSeal.stoppingRule, originalStopping);
  assert.equal(
    originalSeal.stoppingRuleSemanticDigest,
    hashCanonical("campaign-stopping-rule/v1", originalStopping),
  );

  await writeJson(stoppingPath, {
    ...originalStopping,
    minimumAssignmentsPerCell: 1,
    maximumAssignmentsPerCell: 1,
  });
  await assert.rejects(
    fixture.orchestrator.validate(),
    /dependency changed/u,
  );
  await writeJson(stoppingPath, originalStopping);
  assert.equal((await fixture.orchestrator.validate()).valid, true);

  const tamperedSeal = structuredClone(originalSeal);
  tamperedSeal.stoppingRule.maximumAssignmentsPerCell = 7;
  await writeJson(sealPath, reseal(tamperedSeal));
  await assert.rejects(
    fixture.orchestrator.validate(),
    /stopping policy binding changed/u,
  );

  await writeJson(sealPath, originalSeal);
  assert.equal((await fixture.orchestrator.validate()).valid, true);
});
