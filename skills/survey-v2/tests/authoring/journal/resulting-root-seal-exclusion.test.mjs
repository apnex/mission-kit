import assert from "node:assert/strict";
import test from "node:test";
import {
  assembleJournalRecord,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("a resulting root seal cannot enter JournalRecord assembly", () => {
  const scenario = makeEvidenceJournalScenario();
  const record = scenario.record;
  assert.equal(errorCode(() => assembleJournalRecord({
    journal: [],
    genesisChainDigest:
      scenario.identity.identity.genesisChainDigest(),
    genesisRevisionState: scenario.genesisRevisionState,
    commitId: "commit-other",
    commitKind: record.commitKind,
    actor: record.actor,
    authority: record.authority,
    idempotency: {
      machineId: "authoring-kernel",
      key: "different-key",
    },
    commandDigest: record.commandDigest,
    payloadDigest: record.payloadDigest,
    before: record.before,
    after: record.after,
    mutationDigest: record.mutationDigest,
    machineEdges: [],
    rootSealDigest: `sha256:${"f".repeat(64)}`,
  })), "JOURNAL_RECORD_OPTIONS_INVALID");
});
