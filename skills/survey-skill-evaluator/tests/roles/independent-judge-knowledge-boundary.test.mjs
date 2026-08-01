import assert from "node:assert/strict";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("each judge receives one blind bundle and registered key but no peer ballot or arm map", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  await fixture.orchestrator.advance();

  const invocations = fixture.invocations.filter(
    (entry) => entry.roleClass === "semantic-judge",
  );
  assert.equal(invocations.length, 4);
  assert.equal(
    new Set(invocations.map((entry) => entry.workOrder.workOrderId)).size,
    4,
  );
  for (const invocation of invocations) {
    assert.deepEqual(
      Object.keys(invocation.input).sort(),
      [
        "blindEvidenceBundle",
        "postContentAwarenessRequest",
        "reviewAssignment",
        "reviewRef",
        "rubric",
        "semanticKey",
      ],
    );
    assert.equal("armMap" in invocation.input, false);
    assert.equal("armId" in invocation.input, false);
    assert.equal("peerBallot" in invocation.input, false);
    assert.equal("sealedBallots" in invocation.input, false);
    assert.equal("armId" in invocation.input.reviewAssignment, false);
    assert.equal("armMap" in invocation.input.reviewAssignment, false);
    assert.equal("outcome" in invocation.input.reviewAssignment, false);
  }
});
