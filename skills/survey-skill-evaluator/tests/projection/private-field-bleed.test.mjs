import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { PACKAGE_ROOT } from "../composition/package-fixture.mjs";

test("role projections keep private persona, semantic key, arm map, and peer results inside their authorized roles", async () => {
  const load = async (roleId) =>
    JSON.parse(
      await readFile(
        join(PACKAGE_ROOT, "references/role-capsules", `${roleId}.json`),
        "utf8",
      ),
    );
  const director = await load("synthetic-director");
  const executor = await load("survey-executor");
  const judge = await load("semantic-judge");
  assert.ok(director.authorizedContents.includes("private-persona-brief"));
  assert.ok(director.forbiddenContents.includes("semantic-key"));
  assert.ok(executor.forbiddenContents.includes("private-persona"));
  assert.ok(executor.forbiddenContents.includes("peer-result"));
  assert.ok(judge.authorizedContents.includes("semantic-key"));
  assert.ok(judge.forbiddenContents.includes("arm-map"));
  assert.ok(judge.forbiddenContents.includes("peer-ballot"));
});
