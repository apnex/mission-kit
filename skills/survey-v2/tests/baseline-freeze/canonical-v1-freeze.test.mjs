import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateCanonicalV1Freeze } from "./freeze-contract.mjs";

test("canonical Survey v1 freeze is closed, complete, and content-derived", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("./canonical-v1.freeze.json", import.meta.url), "utf8")
  );
  assert.equal(validateCanonicalV1Freeze(fixture), fixture);
  const incomplete = structuredClone(fixture);
  incomplete.inventory.entries.pop();
  assert.throws(
    () => validateCanonicalV1Freeze(incomplete),
    (error) => error.code === "BASELINE_FREEZE_INVALID"
  );
});
