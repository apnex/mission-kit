import assert from "node:assert/strict";
import test from "node:test";
import {
  appendFile,
  chmod,
  readFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";

test("campaign sealing binds exact candidate bytes and rejects post-seal arm drift", async (t) => {
  const fixture = await makeCampaignFixture();
  t.after(fixture.cleanup);
  const validation = await fixture.orchestrator.validate();
  assert.equal(validation.valid, true);

  const seal = JSON.parse(
    await readFile(
      join(fixture.workspaceRoot, ".evaluator", "campaign-seal.json"),
      "utf8",
    ),
  );
  assert.equal(seal.candidateArms.length, 2);
  assert.ok(
    seal.candidateArms.every(
      (arm) =>
        /^[a-f0-9]{64}$/u.test(arm.candidatePackageRoot) &&
        /^[a-f0-9]{64}$/u.test(arm.candidateSnapshotDigest),
    ),
  );

  const snapshotPath = join(
    fixture.workspaceRoot,
    fixture.input.arms[0].snapshotRef,
  );
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  const stagedSkill = join(
    dirname(snapshotPath),
    snapshot.snapshotLayout.payloadDirectory,
    "SKILL.md",
  );
  await chmod(stagedSkill, 0o600);
  await appendFile(stagedSkill, "\npost-seal drift\n", "utf8");
  await assert.rejects(
    fixture.orchestrator.validate(),
    /snapshot|package|inventory|digest|changed/u,
  );
});
