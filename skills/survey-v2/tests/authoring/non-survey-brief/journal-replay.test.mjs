import assert from "node:assert/strict";
import test from "node:test";
import {
  completeBriefFlow,
  createBriefHarness,
} from "./support.mjs";

test(
  "the terminal Brief journal authentically replays one evidence and one transition record per authored stage",
  async () => {
    const harness = await createBriefHarness();
    await completeBriefFlow(harness);
    const { snapshot, replay, pending } =
      await harness.coordinator.read(harness.storeId);

    assert.equal(snapshot.commitRevision, 4);
    assert.equal(snapshot.workspace.spec.semanticRevision, 2);
    assert.equal(snapshot.workspace.spec.evidenceRevision, 4);
    assert.equal(snapshot.journal.length, 4);
    assert.deepEqual(
      snapshot.journal.map((record) => record.commitKind),
      ["evidence", "transition", "evidence", "transition"],
    );
    assert.deepEqual(
      snapshot.journal.map((record) =>
        record.machineEdges.map((edge) => edge.transitionId)),
      [[], ["BA01"], [], ["BA02"]],
    );
    assert.deepEqual(
      snapshot.idempotencyOutcomeView.map(
        (entry) => entry.outcome.class,
      ),
      [
        "assignment-issued",
        "transition-committed",
        "assignment-issued",
        "transition-committed",
      ],
    );
    assert.equal(
      snapshot.machineHeads[0].machineId,
      "brief-authoring",
    );
    assert.equal(snapshot.machineHeads[0].state, "complete");
    assert.deepEqual(replay.revisionState, {
      semanticRevision: 2,
      evidenceRevision: 4,
      semanticStateDigest:
        snapshot.workspace.spec.integrity.semanticStateDigest,
    });
    assert.equal(replay.outcomes.length, 4);
    assert.deepEqual(replay.machineHeads, snapshot.machineHeads);
    assert.equal(pending, null);
    for (const record of snapshot.journal) {
      assert.match(
        record.authenticationDigest,
        /^sha256:[0-9a-f]{64}$/u,
      );
      assert.match(record.recordDigest, /^sha256:[0-9a-f]{64}$/u);
    }
  },
);
