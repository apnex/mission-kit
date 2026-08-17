import test from "node:test";
import assert from "node:assert/strict";
import { ConflictError } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("two commands racing on one revision have exactly one winner", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  await fixture.engine.execute(fixture.command());
  const closeA = fixture.command({
    transitionId: "S02",
    expectedRevision: 1,
    idempotencyKey: "sample/close/a",
    value: 2,
  });
  const closeB = fixture.command({
    transitionId: "S02",
    expectedRevision: 1,
    idempotencyKey: "sample/close/b",
    value: 3,
  });
  const settled = await Promise.allSettled([
    fixture.engine.execute(closeA),
    fixture.engine.execute(closeB),
  ]);
  assert.equal(settled.filter((result) => result.status === "fulfilled").length, 1);
  const rejection = settled.find((result) => result.status === "rejected");
  assert.ok(rejection.reason instanceof ConflictError);
  const state = await fixture.stateStore.load("sample", "sample-1");
  assert.equal(state.authoritativeStateCore.semanticState.revision, 2);
  assert.equal(state.authoritativeStateCore.eventLedger.length, 2);
});
