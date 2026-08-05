import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertJournalRecord,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  appendTransitionScenario,
  errorCode,
} from "./support.mjs";

test("Journal machine edges enforce the sealed K10 identifiers", () => {
  const record = appendTransitionScenario().transitionRecord;
  const changed = (field, value) => {
    const candidate = structuredClone(record);
    candidate.machineEdges[0][field] = value;
    candidate.recordDigest = journalRecordDigest(candidate);
    return errorCode(() => assertJournalRecord(candidate));
  };

  assert.deepEqual([
    changed("transitionId", "bad"),
    changed("transitionId", "A"),
    changed("fromState", ""),
    changed("eventId", "bad"),
    changed("toState", "BAD"),
  ], Array(5).fill("MACHINE_EDGE_INVALID"));
});
