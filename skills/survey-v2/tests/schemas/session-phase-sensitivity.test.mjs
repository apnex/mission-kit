import assert from "node:assert/strict";
import test from "node:test";
import { validateById } from "../../generated/validators.mjs";
import {
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";

test("a phase branch rejects future responses and candidates retained in an early state", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const mutant = structuredClone(run.session);
    mutant.phase = "round_1_drafting";
    mutant.runtimeStatus = "active";
    mutant.outbox = null;
    assert.deepEqual(Object.keys(mutant.responses).sort(), [
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "Q5",
      "Q6"
    ]);
    assert.equal(mutant.candidates.length, 1);
    const result = validateById(
      mutant.$schema,
      mutant
    );
    assert.equal(result.valid, false);
  } finally {
    await run.cleanup();
  }
});
