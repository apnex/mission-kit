import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("adjudication selects only sealed ballot values and retains the dissent set", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  await fixture.orchestrator.advance();

  const roleRoot = join(fixture.workspaceRoot, "evidence", "roles");
  const records = await Promise.all(
    (await readdir(roleRoot)).map(async (name) =>
      JSON.parse(await readFile(join(roleRoot, name), "utf8")),
    ),
  );
  const adjudications = records.filter(
    (record) => record.roleClass === "adjudicator",
  );
  assert.ok(adjudications.length >= 1);
  for (const record of adjudications) {
    assert.equal(
      record.content.resolution.disagreementCount,
      record.content.resolution.items.length,
    );
    for (const item of record.content.resolution.items) {
      assert.equal(new Set(item.sealedValues).size >= 2, true);
      assert.equal(item.sealedValues.includes(item.selectedScore), true);
      assert.equal(item.dissentPreserved, true);
    }
  }
});
