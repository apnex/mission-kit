import assert from "node:assert/strict";
import test from "node:test";
import {
  makeCampaignFixture,
} from "../helpers/campaign-fixture.mjs";

test("campaign seal binds every arm to its exact validated candidate snapshot", async () => {
  const fixture = await makeCampaignFixture();
  try {
    const seal = await fixture.orchestrator.loadSeal();
    assert.equal(seal.candidateArms.length, 2);
    assert.deepEqual(
      seal.candidateArms.map((entry) => entry.armId),
      ["candidate", "control"],
    );
    for (const arm of seal.candidateArms) {
      assert.match(arm.candidateSnapshotDigest, /^[a-f0-9]{64}$/u);
      assert.match(arm.candidatePackageRoot, /^[a-f0-9]{64}$/u);
      assert.equal(arm.skillIdentity, "survey");
    }
  } finally {
    await fixture.cleanup();
  }
});
