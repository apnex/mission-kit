import assert from "node:assert/strict";
import test from "node:test";
import { makeEvidenceJournalScenario } from "./support.mjs";

test("an evidence journal record contains zero machine edges", () => {
  assert.deepEqual(
    makeEvidenceJournalScenario().record.machineEdges,
    [],
  );
});
