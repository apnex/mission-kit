import test from "node:test";
import assert from "node:assert/strict";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("an accepted transition atomically persists state, event, and outbox and replays exactly", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const command = fixture.command();
  const first = await fixture.engine.execute(command);
  const replay = await fixture.engine.execute(command);
  const stored = await fixture.stateStore.load("sample", "sample-1", {
    required: true,
  });

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.eventRoot, first.eventRoot);
  assert.equal(replay.semanticCoreDigest, first.semanticCoreDigest);
  assert.equal(stored.authoritativeStateCore.eventLedger.length, 1);
  assert.equal(stored.authoritativeStateCore.outboxLedger.length, 1);
});
