import assert from "node:assert/strict";
import test from "node:test";
import { newRun, proposer, transition } from "../fixtures/runtime-fixture.mjs";

test("Round 2 begins only from sealed Round-1 semantic ancestry", async () => {
  const run = await newRun();
  try {
    await assert.rejects(
      transition(run, {
        event: "BEGIN_R2_DESIGN",
        eventId: "ordering:early-r2",
        actor: proposer()
      }),
      (error) => error.code === "ILLEGAL_STATE"
    );
    const transitionDefinition = run.session.protocol.snapshot.machines
      .find((machine) => machine.id === "phase")
      .transitions.find((item) => item.id === "T13");
    assert.equal(transitionDefinition.from, "round_1_interpreted");
    assert.equal(transitionDefinition.to, "round_2_drafting");
  } finally {
    await run.cleanup();
  }
});
