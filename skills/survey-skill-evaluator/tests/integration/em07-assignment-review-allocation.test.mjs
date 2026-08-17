import assert from "node:assert/strict";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("EM07 preserves balanced assignments and two blind review allocations per subject", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  const result = await fixture.orchestrator.advance();
  assert.equal(result.assignmentCount, 2);
  assert.equal(result.independentBallotCount, 4);
  const judges = fixture.invocations.filter(
    (entry) => entry.roleClass === "semantic-judge",
  );
  const allocationCounts = new Map();
  for (const entry of judges) {
    const key = entry.input.reviewRef.split(":").slice(0, -1).join(":");
    allocationCounts.set(key, (allocationCounts.get(key) ?? 0) + 1);
    assert.equal("armMap" in entry.input, false);
  }
  assert.deepEqual([...allocationCounts.values()].sort(), [2, 2]);
});
