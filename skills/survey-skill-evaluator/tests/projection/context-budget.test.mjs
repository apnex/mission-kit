import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { PACKAGE_ROOT } from "../composition/package-fixture.mjs";

test("role capsules carry finite input/output/tool budgets and a one-hop reference limit", async () => {
  const registry = JSON.parse(
    await readFile(
      join(PACKAGE_ROOT, "source/fragments/roles/role-registry.json"),
      "utf8",
    ),
  );
  assert.equal(registry.budgets.referenceHopLimit, 1);
  for (const key of [
    "inputByteLimit",
    "inputTokenLimit",
    "outputByteLimit",
    "outputTokenLimit",
    "toolResultByteLimit",
  ]) {
    assert.ok(Number.isSafeInteger(registry.budgets[key]));
    assert.ok(registry.budgets[key] > 0);
  }
});
