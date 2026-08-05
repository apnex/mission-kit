import assert from "node:assert/strict";
import test from "node:test";
import {
  evidenceMutationDigest,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import { makeEvidenceJournalScenario } from "./support.mjs";

test("EvidenceCommitPlan binds its complete closed pre-journal ancestry", () => {
  const { plan } = makeEvidenceJournalScenario();
  assert.deepEqual([
    plan.mutationDigest === evidenceMutationDigest(plan),
    Object.hasOwn(plan, "recordDigest"),
    Object.hasOwn(plan, "rootSealDigest"),
  ], [true, false, false]);
});
