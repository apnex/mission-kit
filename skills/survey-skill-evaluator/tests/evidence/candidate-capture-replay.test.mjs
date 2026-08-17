import assert from "node:assert/strict";
import test from "node:test";
import {
  captureCandidatePackage,
} from "../../source/executables/orchestrator/index.mjs";
import {
  descriptorOnlyAdapter,
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";

test("candidate capture replays identical source bytes at the same destination", async () => {
  const fixture = await makeCandidateCapture();
  try {
    const replay = await captureCandidatePackage({
      authorityRoot: fixture.authorityRoot,
      sourceRoot: fixture.sourceRoot,
      destinationRoot: fixture.destinationRoot,
      adapter: descriptorOnlyAdapter(),
    });
    assert.equal(replay.replayed, true);
    assert.equal(
      replay.snapshot.candidateSnapshotId,
      fixture.captured.snapshot.candidateSnapshotId,
    );
  } finally {
    await fixture.cleanup();
  }
});
