import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeFullRoleCampaignFixture } from "../helpers/full-role-campaign-fixture.mjs";

function containsKey(value, forbidden) {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((entry) => containsKey(entry, forbidden));
  }
  return Object.entries(value).some(
    ([key, entry]) => forbidden.has(key) || containsKey(entry, forbidden),
  );
}

test("sealed role execution keeps Director, executor, judge, and adjudicator projections capability-separated", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  await fixture.orchestrator.advance();

  const byRole = new Map();
  for (const invocation of fixture.invocations) {
    const rows = byRole.get(invocation.roleClass) ?? [];
    rows.push(invocation);
    byRole.set(invocation.roleClass, rows);
  }
  for (const role of [
    "synthetic-director",
    "survey-executor",
    "semantic-judge",
    "adjudicator",
  ]) {
    assert.ok(byRole.get(role)?.length > 0, `${role} was not independently run`);
  }
  assert.equal(
    new Set(fixture.invocations.map((entry) => entry.workOrder.workOrderId))
      .size,
    fixture.invocations.length,
  );

  const forbiddenByRole = new Map([
    [
      "synthetic-director",
      new Set(["semanticKey", "rubric", "armMap", "peerResults"]),
    ],
    [
      "survey-executor",
      new Set(["privatePersonaBrief", "semanticKey", "armMap", "peerResults"]),
    ],
    [
      "semantic-judge",
      new Set(["armMap", "privatePersonaBrief", "peerBallot"]),
    ],
    [
      "adjudicator",
      new Set(["armMap", "privatePersonaBrief", "newScoreSurface"]),
    ],
  ]);
  for (const [role, rows] of byRole) {
    const forbidden = forbiddenByRole.get(role);
    if (!forbidden) continue;
    for (const row of rows) {
      assert.equal(
        containsKey(row.input, forbidden),
        false,
        `${role}:${row.workOrder.workOrderId}`,
      );
    }
  }

  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "survey-executor",
        workOrderId: "cross-role-injection",
        inputProjection: { armMap: { candidate: "treatment" } },
        outputSchemaId: "role-result",
      }),
    /forbidden field/u,
  );
});
