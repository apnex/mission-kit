import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hashCanonical } from "../../source/executables/engine/index.mjs";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

test("campaign seal rejects unknown and invalid authored input fields before creating authority state", async (t) => {
  const fixture = await makeCampaignFixture({ seal: false });
  t.after(fixture.cleanup);
  const inputPath = join(fixture.workspaceRoot, "campaign-input.json");
  const original = JSON.parse(await readFile(inputPath, "utf8"));
  const invalidInputs = [
    {
      label: "unknown root field",
      value: { ...original, postOutcomeOverride: true },
    },
    {
      label: "unknown nested population field",
      value: {
        ...original,
        population: {
          ...original.population,
          hiddenSelectionRule: "favorable-only",
        },
      },
    },
    {
      label: "unsupported use class",
      value: { ...original, useClass: "release-by-evaluator" },
    },
    {
      label: "unregistered control arm",
      value: {
        ...original,
        controlAuditPolicy: {
          ...original.controlAuditPolicy,
          controlArmId: "not-an-arm",
        },
      },
    },
    {
      label: "population weights do not sum to one",
      value: {
        ...original,
        population: {
          ...original.population,
          strata: [
            { stratumId: "canonical", weight: 0.6 },
            { stratumId: "adversarial", weight: 0.5 },
          ],
        },
      },
    },
  ];

  for (const invalid of invalidInputs) {
    await writeJson(inputPath, invalid.value);
    await assert.rejects(
      fixture.orchestrator.seal(),
      /generated schema|registered arms|weights must sum/u,
      invalid.label,
    );
    assert.equal((await fixture.orchestrator.status()).sealed, false);
  }

  await writeJson(inputPath, original);
  const result = await fixture.orchestrator.seal();
  assert.equal(result.replayed, false);
  const seal = await fixture.orchestrator.loadSeal();
  assert.deepEqual(
    JSON.parse(JSON.stringify(seal.authoredCampaign)),
    original,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(seal.controlAuditPolicy)),
    original.controlAuditPolicy,
  );
  assert.equal(
    seal.controlAuditPolicyDigest,
    hashCanonical(
      "campaign-control-audit-policy/v1",
      original.controlAuditPolicy,
    ),
  );
  assert.equal((await fixture.orchestrator.validate()).valid, true);
});
