import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDiscoveryRoutingFreeze } from "./freeze-contract.mjs";

test("operational Survey v1 discovery is unambiguous while repository duplicate resolution is recorded exactly", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("./discovery-routing.freeze.json", import.meta.url), "utf8")
  );
  assert.equal(validateDiscoveryRoutingFreeze(fixture), fixture);
  const ambiguous = structuredClone(fixture);
  ambiguous.operationalDiscovery.matchingEntrypoints.push(
    "/home/apnex/.codex/skills/survey-v2/SKILL.md"
  );
  ambiguous.operationalDiscovery.unambiguous = false;
  assert.throws(
    () => validateDiscoveryRoutingFreeze(ambiguous),
    (error) => error.code === "BASELINE_FREEZE_INVALID"
  );
});
