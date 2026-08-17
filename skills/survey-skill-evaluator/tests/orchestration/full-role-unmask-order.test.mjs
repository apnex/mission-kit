import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("the analyst grant binds the exact awareness universe only after every role reaches AW4", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  const result = await fixture.orchestrator.advance();

  const awarenessRoot = join(
    fixture.workspaceRoot,
    ".evaluator",
    "role-protocol",
    "awareness",
  );
  const obligationRoot = join(awarenessRoot, "obligations");
  const obligations = await Promise.all(
    (await readdir(obligationRoot)).map(async (name) =>
      JSON.parse(await readFile(join(obligationRoot, name), "utf8")),
    ),
  );
  const grantNames = await readdir(join(awarenessRoot, "unmask-grants"));
  assert.equal(grantNames.length, 1);
  const grant = JSON.parse(
    await readFile(
      join(awarenessRoot, "unmask-grants", grantNames[0]),
      "utf8",
    ),
  );
  assert.equal(obligations.length, result.awarenessObligationCount);
  assert.equal(
    obligations.every((record) => record.state === "AW4_CLOSED"),
    true,
  );
  assert.deepEqual(
    grant.expectedObligationIds,
    obligations.map((record) => record.obligationId).sort(),
  );
  assert.deepEqual(
    grant.roots.map((entry) => entry.awarenessStateRoot).sort(),
    obligations.map((record) => record.awarenessStateRoot).sort(),
  );
});
