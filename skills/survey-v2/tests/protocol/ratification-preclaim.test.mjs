import assert from "node:assert/strict";
import test from "node:test";
import {
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";

test("a proposer cannot pre-populate Director ratification in a candidate model", async () => {
  const run = await newRun();
  try {
    await assert.rejects(
      reachAwaitingRatification(run, {
        mutateComposite: (model) => ({
          ...model,
          ratification: {
            authority: "director-only",
            status: "ratified",
            eventId: "forged-director-event",
            semanticDigest: "sha256:".padEnd(71, "0"),
            renderDigest: "sha256:".padEnd(71, "1")
          }
        })
      }),
      (error) => error.code === "CANDIDATE_ANCESTRY"
    );
    assert.equal(run.session.phase, "composite_drafting");
    assert.equal(run.session.candidates.length, 0);
    assert.equal(run.session.ratification, null);
  } finally {
    await run.cleanup();
  }
});
