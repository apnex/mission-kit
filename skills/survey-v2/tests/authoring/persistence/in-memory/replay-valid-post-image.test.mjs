import assert from "node:assert/strict";
import test from "node:test";
import {
  replayAuthoringJournal,
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  commitEvidence,
  createStoreHarness,
} from "./support.mjs";

test("the committed adapter fixture is a complete replay-valid neutral snapshot", async () => {
  const harness = await createStoreHarness();
  const committed = await commitEvidence(harness);
  const snapshot = committed.snapshot;
  const replayed = replayAuthoringJournal({
    commitRevision: snapshot.commitRevision,
    workspace: snapshot.workspace,
    journal: snapshot.journal,
    machineHeads: snapshot.machineHeads,
    idempotencyOutcomeView:
      snapshot.idempotencyOutcomeView,
    authoringMachineId: "authoring-kernel",
    identity: harness.identity,
  });

  assert.deepEqual(replayed.machineHeads, snapshot.machineHeads);
  assert.equal(replayed.outcomes[0].class, "event-rejected");
});
