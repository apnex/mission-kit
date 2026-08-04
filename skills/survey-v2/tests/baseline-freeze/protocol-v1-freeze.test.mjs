import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateProtocolV1Freeze } from "./freeze-contract.mjs";

test("protocol-v1 freeze binds the recovered package, results, sessions, and compatibility claim boundary", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("./protocol-v1.freeze.json", import.meta.url), "utf8")
  );
  assert.equal(validateProtocolV1Freeze(fixture), fixture);
  const overclaim = structuredClone(fixture);
  overclaim.compatibilityPolicy.productionRuntimeEnforcementClaimed = true;
  assert.throws(
    () => validateProtocolV1Freeze(overclaim),
    (error) => error.code === "BASELINE_FREEZE_INVALID"
  );
});
