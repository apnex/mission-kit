import assert from "node:assert/strict";
import test from "node:test";
import {
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";

test("the acknowledged walkthrough reconstructs every frozen candidate field", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const candidate = run.session.candidates.find((item) => !item.superseded);
    const walkthrough = run.session.interpretations.walkthrough;
    const reconstructed = Object.assign(
      {},
      ...walkthrough.segments.map((segment) => JSON.parse(segment.content))
    );
    assert.deepEqual(reconstructed, candidate.model);
    assert.equal(
      walkthrough.acknowledgements.length,
      walkthrough.segments.length
    );
    assert.deepEqual(
      walkthrough.acknowledgements.map((item) => item.index),
      walkthrough.segments.map((_, index) => index)
    );
  } finally {
    await run.cleanup();
  }
});
