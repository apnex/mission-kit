import assert from "node:assert/strict";
import test from "node:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  makeCampaignFixture,
} from "../helpers/campaign-fixture.mjs";

test("campaign seal binds authored claims to captured arm conditions and the analysis estimand", async (t) => {
  const valid = await makeCampaignFixture();
  const invalid = await makeCampaignFixture({ seal: false });
  t.after(valid.cleanup);
  t.after(invalid.cleanup);

  const validSeal = await valid.orchestrator.loadSeal();
  assert.equal(validSeal.registeredClaims.length, 1);
  assert.equal(validSeal.registeredClaims[0].registeredContrast, true);
  assert.equal(validSeal.registeredClaims[0].treatmentArmId, "candidate");
  assert.equal(validSeal.registeredClaims[0].controlArmId, "control");
  assert.equal(
    validSeal.registeredClaims[0].treatmentSnapshotDigest,
    validSeal.candidateArms.find((arm) => arm.armId === "candidate")
      .candidateSnapshotDigest,
  );

  const changed = structuredClone(invalid.input);
  changed.arms.find((arm) => arm.armId === "control").conditionClass =
    "neutral-control";
  await writeFile(
    join(invalid.workspaceRoot, "campaign-input.json"),
    `${JSON.stringify(changed)}\n`,
    "utf8",
  );
  await assert.rejects(
    invalid.orchestrator.seal(),
    /Counterfactual condition is invalid/u,
  );
  assert.equal(
    await invalid.orchestrator.loadSeal({ required: false }),
    null,
  );
});
