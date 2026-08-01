import assert from "node:assert/strict";
import test from "node:test";
import {
  sealSession,
  verifySession
} from "../../source/executables/runtime/lib/storage.mjs";
import {
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";

test("cold verification rejects a resealed snapshot whose candidate no longer replays from events", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const mutant = structuredClone(run.session);
    mutant.candidates[0].model.scope.push("UNREVIEWED-TAMPER");
    sealSession(mutant);
    assert.throws(
      () => verifySession(mutant),
      (error) => error.failureClass === "semantic-product-invalid"
    );
  } finally {
    await run.cleanup();
  }
});
