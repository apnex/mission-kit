import assert from "node:assert/strict";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

function containsForbiddenKey(value, forbidden) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((entry) => containsForbiddenKey(entry, forbidden));
  }
  return Object.entries(value).some(
    ([key, entry]) =>
      forbidden.has(key) || containsForbiddenKey(entry, forbidden),
  );
}

test("survey executors receive one bounded subject execution without arm, key, direction, persona, or peer context", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  await fixture.orchestrator.advance();

  const invocations = fixture.invocations.filter(
    (entry) => entry.roleClass === "survey-executor",
  );
  assert.equal(invocations.length, 2);
  const forbidden = new Set([
    "armMap",
    "armId",
    "semanticKey",
    "expectedDirection",
    "privatePersona",
    "privatePersonaBrief",
    "peerResult",
    "peerResults",
  ]);
  for (const invocation of invocations) {
    assert.equal(
      containsForbiddenKey(invocation.input, forbidden),
      false,
      invocation.workOrder.workOrderId,
    );
    assert.deepEqual(
      Object.keys(invocation.input).sort(),
      [
        "assignmentRef",
        "candidateSession",
        "declaredTools",
        "postContentAwarenessRequest",
        "projectFixture",
        "publicScenario",
        "subjectExecution",
      ],
    );
    assert.deepEqual(
      Object.keys(invocation.input.subjectExecution).sort(),
      [
        "adapterId",
        "artifact",
        "candidatePackageRoot",
        "candidateSnapshotId",
        "envelopeRef",
        "subjectExecutionDigest",
        "terminalObservationDigest",
      ],
    );
  }
});
