import test from "node:test";
import assert from "node:assert/strict";
import { newRun, reachAwaitingQ1 } from "../fixtures/runtime-fixture.mjs";

test("the Director view contains exactly the current question and its options.", async () => {
  const run = await newRun();
  try {
    await reachAwaitingQ1(run);
    const view = run.session.outbox.payload;
    assert.equal(view.kind, "question");
    assert.equal(view.questionId, "Q1");
    assert.equal(view.options.length, 3);
    assert.equal(JSON.stringify(view).includes("Q2"), false);
  } finally {
    await run.cleanup();
  }
});
