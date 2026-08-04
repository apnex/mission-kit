import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateTestDisposition } from "./freeze-contract.mjs";

test("every recovered protocol-v1 test has one explicit retained, replacement, or retirement disposition", async () => {
  const disposition = JSON.parse(
    await readFile(new URL("./v1-test-disposition.json", import.meta.url), "utf8")
  );
  assert.equal(validateTestDisposition(disposition), disposition);
  const liveManifest = JSON.parse(
    await readFile(new URL("../test-evidence.manifest.json", import.meta.url), "utf8")
  );
  const liveIds = new Set(liveManifest.tests.map((entry) => entry.id));
  assert.ok(disposition.entries.every((entry) => liveIds.has(entry.testId)));
  const duplicate = structuredClone(disposition);
  duplicate.entries[1] = structuredClone(duplicate.entries[0]);
  assert.throws(
    () => validateTestDisposition(duplicate),
    (error) => error.code === "BASELINE_FREEZE_INVALID"
  );
});
