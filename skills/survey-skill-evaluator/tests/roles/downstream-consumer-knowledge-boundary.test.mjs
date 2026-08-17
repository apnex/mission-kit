import assert from "node:assert/strict";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("downstream consumers receive one blind artifact and common task without scoring or comparative context", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  await fixture.orchestrator.advance();

  const invocations = fixture.invocations.filter(
    (entry) => entry.roleClass === "downstream-consumer",
  );
  assert.equal(invocations.length, 2);
  for (const invocation of invocations) {
    assert.deepEqual(
      Object.keys(invocation.input).sort(),
      [
        "assignmentRef",
        "blindSurveyArtifact",
        "commonPublicTask",
        "declaredTools",
        "outputContract",
        "postContentAwarenessRequest",
      ],
    );
    for (const forbidden of [
      "semanticKey",
      "rubric",
      "armMap",
      "armId",
      "peerArtifact",
      "expectedDirection",
    ]) {
      assert.equal(forbidden in invocation.input, false);
    }
  }
});
