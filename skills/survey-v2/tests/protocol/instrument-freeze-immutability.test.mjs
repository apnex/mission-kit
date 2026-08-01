import assert from "node:assert/strict";
import test from "node:test";
import {
  instrumentDraft,
  newRun,
  proposer,
  transition
} from "../fixtures/runtime-fixture.mjs";

test("a disclosed round cannot mutate its frozen instrument", async () => {
  const run = await newRun();
  try {
    await transition(run, {
      event: "BEGIN_R1_DESIGN",
      eventId: "freeze:begin",
      actor: proposer()
    });
    await transition(run, {
      event: "SAVE_R1_INSTRUMENT_DRAFT",
      eventId: "freeze:save",
      actor: proposer(),
      payload: { draft: instrumentDraft(1) }
    });
    await transition(run, {
      event: "FREEZE_R1",
      eventId: "freeze:commit",
      actor: proposer()
    });
    const frozenDigest = run.session.interpretations.round1Instrument.freezeDigest;
    await assert.rejects(
      transition(run, {
        event: "SAVE_R1_INSTRUMENT_DRAFT",
        eventId: "freeze:mutate",
        actor: proposer(),
        payload: { draft: instrumentDraft(1) }
      }),
      (error) => error.code === "ILLEGAL_STATE"
    );
    assert.equal(run.session.interpretations.round1Instrument.freezeDigest, frozenDigest);
  } finally {
    await run.cleanup();
  }
});
